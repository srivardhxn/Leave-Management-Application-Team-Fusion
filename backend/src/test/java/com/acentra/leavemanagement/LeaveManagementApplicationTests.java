package com.acentra.leavemanagement;

import com.acentra.leavemanagement.controller.DTOs;
import com.acentra.leavemanagement.model.LeaveRequest;
import com.acentra.leavemanagement.model.LeaveStatus;
import com.acentra.leavemanagement.model.User;
import com.acentra.leavemanagement.repository.LeaveRequestRepository;
import com.acentra.leavemanagement.repository.UserRepository;
import com.acentra.leavemanagement.service.LeaveService;
import com.acentra.leavemanagement.service.ProRataLeaveCalculator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class LeaveManagementApplicationTests {

    @Autowired
    private ProRataLeaveCalculator proRataCalculator;

    @Autowired
    private LeaveService leaveService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Test
    @DisplayName("MANDATORY REQUIREMENT: Pro-rata leave calculation - July 1 joiner gets 12 days out of 24")
    void testProRataCalculationJuly1st() {
        int currentYear = LocalDate.now().getYear();
        LocalDate july1st = LocalDate.of(currentYear, 7, 1);
        double balance = proRataCalculator.calculateProRata(july1st, currentYear, 24.0);

        // Expectation: 6 remaining months in the year / 12 * 24 = 12.0 days
        assertThat(balance).isEqualTo(12.0);

        // Previous year joiner gets full allowance
        LocalDate previousYearJoin = LocalDate.of(currentYear - 1, 11, 20);
        assertThat(proRataCalculator.calculateProRata(previousYearJoin, currentYear, 24.0)).isEqualTo(24.0);

        // Jan 1 joiner gets full 24 days
        LocalDate jan1st = LocalDate.of(currentYear, 1, 1);
        assertThat(proRataCalculator.calculateProRata(jan1st, currentYear, 24.0)).isEqualTo(24.0);
    }

    @Test
    @DisplayName("MANDATORY REQUIREMENT: Smart Conflict Detection (>20% of team on leave sets flag but does not block)")
    void testSmartConflictDetectionDoesNotBlock() {
        List<User> alphaUsers = userRepository.findByTeamId(1L);
        assertThat(alphaUsers).isNotEmpty();

        User testUser = alphaUsers.get(0);
        LocalDate startDate = LocalDate.now().plusDays(30);
        LocalDate endDate = LocalDate.now().plusDays(34);

        // Apply first leave for testUser
        DTOs.ApplyLeaveRequest req1 = new DTOs.ApplyLeaveRequest();
        req1.setUserId(testUser.getId());
        req1.setStartDate(startDate);
        req1.setEndDate(endDate);
        req1.setReason("First team member leave");

        LeaveRequest saved1 = leaveService.applyLeave(req1);
        assertThat(saved1).isNotNull();
        assertThat(saved1.getStatus()).isEqualTo(LeaveStatus.MANAGER_PENDING);

        // Second team member applies during the EXACT same window
        User teammate = alphaUsers.get(1);
        DTOs.ApplyLeaveRequest req2 = new DTOs.ApplyLeaveRequest();
        req2.setUserId(teammate.getId());
        req2.setStartDate(startDate);
        req2.setEndDate(endDate);
        req2.setReason("Second team member leave concurrent");

        LeaveRequest saved2 = leaveService.applyLeave(req2);
        assertThat(saved2).isNotNull();
        // Crucial test: request must NOT be blocked, and hasTeamConflict must be TRUE!
        assertThat(saved2.getStatus()).isEqualTo(LeaveStatus.MANAGER_PENDING);
        assertThat(saved2.getHasTeamConflict()).isTrue();
        assertThat(saved2.getConflictDetails()).contains("Team Capacity Warning");
    }

    @Test
    @DisplayName("MANDATORY REQUIREMENT: StateMachine transitions & auto-escalation note")
    void testStateMachineApprovalChainAndEscalation() {
        List<User> employees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == com.acentra.leavemanagement.model.Role.EMPLOYEE)
                .toList();
        User emp = employees.get(0);

        DTOs.ApplyLeaveRequest req = new DTOs.ApplyLeaveRequest();
        req.setUserId(emp.getId());
        req.setStartDate(LocalDate.now().plusDays(50));
        req.setEndDate(LocalDate.now().plusDays(52));
        req.setReason("Conference leave");

        // 1. Submit -> Transitions to MANAGER_PENDING
        LeaveRequest submitted = leaveService.applyLeave(req);
        assertThat(submitted.getStatus()).isEqualTo(LeaveStatus.MANAGER_PENDING);

        // 2. Test Escalation transition: MANAGER_PENDING -> HR_PENDING
        LeaveRequest escalated = leaveService.escalateRequest(submitted.getId(), "Auto-escalated due to manager timeout.");
        assertThat(escalated.getStatus()).isEqualTo(LeaveStatus.HR_PENDING);
        assertThat(escalated.getEscalationNote()).isEqualTo("Auto-escalated due to manager timeout.");

        // 3. Test HR Approval: HR_PENDING -> APPROVED
        double balanceBefore = userRepository.findById(emp.getId()).orElseThrow().getLeaveBalance();
        LeaveRequest approved = leaveService.approveByHR(escalated.getId(), null);
        assertThat(approved.getStatus()).isEqualTo(LeaveStatus.APPROVED);

        // Verify balance deducted
        double balanceAfter = userRepository.findById(emp.getId()).orElseThrow().getLeaveBalance();
        assertThat(balanceAfter).isEqualTo(balanceBefore - approved.getTotalDays());
    }
}
