package com.acentra.leavemanagement.statemachine;

import com.acentra.leavemanagement.model.LeaveEvent;
import com.acentra.leavemanagement.model.LeaveRequest;
import com.acentra.leavemanagement.model.LeaveStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.statemachine.StateMachine;
import org.springframework.statemachine.StateMachineEventResult;
import org.springframework.statemachine.config.StateMachineFactory;
import org.springframework.statemachine.support.DefaultStateMachineContext;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Objects;

@Service
public class LeaveStateMachineService {

    private static final Logger log = LoggerFactory.getLogger(LeaveStateMachineService.class);
    private final StateMachineFactory<LeaveStatus, LeaveEvent> stateMachineFactory;

    public LeaveStateMachineService(StateMachineFactory<LeaveStatus, LeaveEvent> stateMachineFactory) {
        this.stateMachineFactory = stateMachineFactory;
    }

    /**
     * Sends an event to transition the leave request state machine.
     *
     * @param request The current LeaveRequest
     * @param event The event being triggered
     * @return The updated LeaveStatus
     */
    public synchronized LeaveStatus processEvent(LeaveRequest request, LeaveEvent event) {
        String machineId = "leave-" + (request.getId() != null ? request.getId() : "new");
        StateMachine<LeaveStatus, LeaveEvent> sm = stateMachineFactory.getStateMachine(machineId);

        try {
            // Stop machine before setting current context
            sm.stopReactively().block();

            // Reset state machine to the current state of the leave request
            sm.getStateMachineAccessor()
                    .doWithAllRegions(accessor -> {
                        accessor.resetStateMachineReactively(
                                new DefaultStateMachineContext<>(request.getStatus(), null, null, null)
                        ).block();
                    });

            // Start machine
            sm.startReactively().block();

            Message<LeaveEvent> message = MessageBuilder.withPayload(event)
                    .setHeader("requestId", request.getId())
                    .build();

            // Send event reactively
            StateMachineEventResult<LeaveStatus, LeaveEvent> result = sm.sendEvent(Mono.just(message))
                    .blockLast();

            LeaveStatus currentState = sm.getState() != null ? sm.getState().getId() : request.getStatus();

            log.info("Request {} processed event {}: from {} to {} (result: {})",
                    request.getId(), event, request.getStatus(), currentState,
                    result != null ? result.getResultType() : "N/A");

            return currentState;
        } finally {
            sm.stopReactively().subscribe();
        }
    }
}
