package com.acentra.leavemanagement.statemachine;

import com.acentra.leavemanagement.model.LeaveEvent;
import com.acentra.leavemanagement.model.LeaveStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.statemachine.config.EnableStateMachineFactory;
import org.springframework.statemachine.config.StateMachineConfigurerAdapter;
import org.springframework.statemachine.config.builders.StateMachineConfigurationConfigurer;
import org.springframework.statemachine.config.builders.StateMachineStateConfigurer;
import org.springframework.statemachine.config.builders.StateMachineTransitionConfigurer;
import org.springframework.statemachine.listener.StateMachineListenerAdapter;
import org.springframework.statemachine.state.State;

import java.util.EnumSet;

@Configuration
@EnableStateMachineFactory
public class StateMachineConfig extends StateMachineConfigurerAdapter<LeaveStatus, LeaveEvent> {

    private static final Logger log = LoggerFactory.getLogger(StateMachineConfig.class);

    @Override
    public void configure(StateMachineConfigurationConfigurer<LeaveStatus, LeaveEvent> config) throws Exception {
        config
            .withConfiguration()
            .autoStartup(false)
            .listener(new StateMachineListenerAdapter<>() {
                @Override
                public void stateChanged(State<LeaveStatus, LeaveEvent> from, State<LeaveStatus, LeaveEvent> to) {
                    log.info("Leave StateMachine transition: {} -> {}", 
                            from != null ? from.getId() : "NONE", 
                            to != null ? to.getId() : "UNKNOWN");
                }
            });
    }

    @Override
    public void configure(StateMachineStateConfigurer<LeaveStatus, LeaveEvent> states) throws Exception {
        states
            .withStates()
            .initial(LeaveStatus.SUBMITTED)
            .states(EnumSet.allOf(LeaveStatus.class))
            .end(LeaveStatus.APPROVED)
            .end(LeaveStatus.REJECTED);
    }

    @Override
    public void configure(StateMachineTransitionConfigurer<LeaveStatus, LeaveEvent> transitions) throws Exception {
        transitions
            // Employee submits leave -> Moves to Manager review
            .withExternal()
                .source(LeaveStatus.SUBMITTED)
                .target(LeaveStatus.MANAGER_PENDING)
                .event(LeaveEvent.SUBMIT)
                .and()
            // Manager approves -> Moves to HR review
            .withExternal()
                .source(LeaveStatus.MANAGER_PENDING)
                .target(LeaveStatus.HR_PENDING)
                .event(LeaveEvent.MANAGER_APPROVE)
                .and()
            // Manager rejects -> Request is REJECTED
            .withExternal()
                .source(LeaveStatus.MANAGER_PENDING)
                .target(LeaveStatus.REJECTED)
                .event(LeaveEvent.MANAGER_REJECT)
                .and()
            // Manager timeout auto-escalation -> Moves directly to HR review
            .withExternal()
                .source(LeaveStatus.MANAGER_PENDING)
                .target(LeaveStatus.HR_PENDING)
                .event(LeaveEvent.ESCALATE)
                .and()
            // HR final approval -> Request is APPROVED
            .withExternal()
                .source(LeaveStatus.HR_PENDING)
                .target(LeaveStatus.APPROVED)
                .event(LeaveEvent.HR_APPROVE)
                .and()
            // HR rejection -> Request is REJECTED
            .withExternal()
                .source(LeaveStatus.HR_PENDING)
                .target(LeaveStatus.REJECTED)
                .event(LeaveEvent.HR_REJECT);
    }
}
