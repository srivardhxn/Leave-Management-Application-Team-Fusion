package com.acentra.leavemanagement.service;

import com.acentra.leavemanagement.controller.DTOs;
import com.acentra.leavemanagement.model.*;
import com.acentra.leavemanagement.repository.LeaveRequestRepository;
import com.acentra.leavemanagement.repository.UserRepository;
import com.acentra.leavemanagement.statemachine.LeaveStateMachineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeaveService {

    private static final Logger log = LoggerFactory.getLogger(LeaveService.class);

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;
    private final LeaveStateMachineService stateMachineService;
    private final ProRataLeaveCalculator proRataCalculator;

    @Value("${leave.conflict.threshold-percentage:20.0}")
    private double conflictThresholdPercentage;

    public LeaveService(LeaveRequestRepository leaveRequestRepository,
                        UserRepository userRepository,
                        LeaveStateMachineService stateMachineService,
                        ProRataLeaveCalculator proRataCalculator) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.userRepository = userRepository;
        this.stateMachineService = stateMachineService;
        this.proRataCalculator = proRataCalculator;
    }

    /**
     * Applies for leave with balance check and smart conflict detection.
     * Transitions StateMachine: SUBMITTED -> MANAGER_PENDING
     */
    public LeaveRequest applyLeave(DTOs.ApplyLeaveRequest requestDto) {
        User user = userRepository.findById(requestDto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + requestDto.getUserId()));

        if (requestDto.getEndDate().isBefore(requestDto.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        int requestedDays = (int) ChronoUnit.DAYS.between(requestDto.getStartDate(), requestDto.getEndDate()) + 1;

        if (user.getLeaveBalance() < requestedDays) {
            throw new IllegalStateException(String.format(
                    "Insufficient leave balance. Requested: %d days, Available balance: %.1f days",
                    requestedDays, user.getLeaveBalance()
            ));
        }

        // Smart Conflict Detection (>20% of team on leave)
        DTOs.ConflictCheckResult conflictCheck = evaluateTeamConflict(
                user.getId(), user.getTeamId(), requestDto.getStartDate(), requestDto.getEndDate()
        );

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setUserId(user.getId());
        leaveRequest.setUserName(user.getName());
        leaveRequest.setUserAvatar(user.getAvatar());
        leaveRequest.setTeamId(user.getTeamId());
        leaveRequest.setTeamName(user.getTeamName());
        leaveRequest.setStartDate(requestDto.getStartDate());
        leaveRequest.setEndDate(requestDto.getEndDate());
        leaveRequest.setTotalDays(requestedDays);
        leaveRequest.setReason(requestDto.getReason());
        leaveRequest.setStatus(LeaveStatus.SUBMITTED);
        leaveRequest.setHasTeamConflict(conflictCheck.isHasConflict());
        leaveRequest.setConflictDetails(conflictCheck.isHasConflict() ? conflictCheck.getDetails() : null);
        leaveRequest.setSubmittedAt(LocalDateTime.now());
        leaveRequest.setUpdatedAt(LocalDateTime.now());

        // Save initially as SUBMITTED
        leaveRequest = leaveRequestRepository.save(leaveRequest);

        // Transition StateMachine SUBMITTED -> MANAGER_PENDING
        LeaveStatus nextState = stateMachineService.processEvent(leaveRequest, LeaveEvent.SUBMIT);
        leaveRequest.setStatus(nextState);
        leaveRequest = leaveRequestRepository.save(leaveRequest);

        log.info("Leave request #{} submitted by {} ({}) - Conflict flag: {}, Initial State: {}",
                leaveRequest.getId(), user.getName(), user.getTeamName(),
                leaveRequest.getHasTeamConflict(), leaveRequest.getStatus());

        return leaveRequest;
    }

    /**
     * Smart Conflict Detection Algorithm:
     * Check if >20% of their team is also on leave during those dates.
     * Crucial: Do NOT block the request. Attach hasTeamConflict = true boolean flag.
     */
    @Transactional(readOnly = true)
    public DTOs.ConflictCheckResult evaluateTeamConflict(Long userId, Long teamId, LocalDate startDate, LocalDate endDate) {
        long totalTeamMembers = userRepository.countByTeamId(teamId);
        if (totalTeamMembers == 0) {
            return new DTOs.ConflictCheckResult(false, 0.0, 0, 0, Collections.emptyList(), "No team members found.");
        }

        List<LeaveStatus> activeStatuses = List.of(
                LeaveStatus.MANAGER_PENDING,
                LeaveStatus.HR_PENDING,
                LeaveStatus.APPROVED
        );

        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlappingTeamLeaves(
                teamId, userId, startDate, endDate, activeStatuses
        );

        Map<Long, String> conflictingMembersMap = overlapping.stream()
                .collect(Collectors.toMap(
                        LeaveRequest::getUserId,
                        LeaveRequest::getUserName,
                        (existing, replacement) -> existing
                ));

        int conflictingCount = conflictingMembersMap.size();
        double conflictPercentage = (conflictingCount / (double) totalTeamMembers) * 100.0;
        boolean hasConflict = conflictPercentage > conflictThresholdPercentage;

        List<String> names = new ArrayList<>(conflictingMembersMap.values());
        String details = hasConflict
                ? String.format("Team Capacity Warning: %.1f%% of team (%d/%d members) concurrently away. Overlapping teammates: %s",
                conflictPercentage, conflictingCount, totalTeamMembers, String.join(", ", names))
                : String.format("Team capacity healthy: %.1f%% on leave (%d/%d members).", conflictPercentage, conflictingCount, totalTeamMembers);

        return new DTOs.ConflictCheckResult(hasConflict, conflictPercentage, conflictingCount, (int) totalTeamMembers, names, details);
    }

    /**
     * Manager Approval: MANAGER_PENDING -> HR_PENDING
     */
    public LeaveRequest approveByManager(Long requestId, DTOs.ReviewActionRequest action) {
        LeaveRequest request = getRequestOrThrow(requestId);

        if (request.getStatus() != LeaveStatus.MANAGER_PENDING) {
            throw new IllegalStateException("Cannot approve request. Expected status MANAGER_PENDING, but was " + request.getStatus());
        }

        LeaveStatus nextState = stateMachineService.processEvent(request, LeaveEvent.MANAGER_APPROVE);
        request.setStatus(nextState);
        request.setUpdatedAt(LocalDateTime.now());
        if (action != null && action.getNote() != null && !action.getNote().isBlank()) {
            request.setReason(request.getReason() + " [Manager Note: " + action.getNote() + "]");
        }

        return leaveRequestRepository.save(request);
    }

    /**
     * Manager Rejection: MANAGER_PENDING -> REJECTED
     */
    public LeaveRequest rejectByManager(Long requestId, DTOs.ReviewActionRequest action) {
        LeaveRequest request = getRequestOrThrow(requestId);

        if (request.getStatus() != LeaveStatus.MANAGER_PENDING) {
            throw new IllegalStateException("Cannot reject request. Expected status MANAGER_PENDING, but was " + request.getStatus());
        }

        LeaveStatus nextState = stateMachineService.processEvent(request, LeaveEvent.MANAGER_REJECT);
        request.setStatus(nextState);
        request.setUpdatedAt(LocalDateTime.now());
        if (action != null && action.getNote() != null && !action.getNote().isBlank()) {
            request.setReason(request.getReason() + " [Manager Rejection Note: " + action.getNote() + "]");
        }

        return leaveRequestRepository.save(request);
    }

    /**
     * HR Approval: HR_PENDING -> APPROVED
     * Deducts leave days from employee's balance.
     */
    public LeaveRequest approveByHR(Long requestId, DTOs.ReviewActionRequest action) {
        LeaveRequest request = getRequestOrThrow(requestId);

        if (request.getStatus() != LeaveStatus.HR_PENDING) {
            throw new IllegalStateException("Cannot approve request. Expected status HR_PENDING, but was " + request.getStatus());
        }

        LeaveStatus nextState = stateMachineService.processEvent(request, LeaveEvent.HR_APPROVE);
        request.setStatus(nextState);
        request.setUpdatedAt(LocalDateTime.now());

        // Deduct leave balance upon final HR approval
        User user = userRepository.findById(request.getUserId()).orElse(null);
        if (user != null) {
            double currentBalance = user.getLeaveBalance() != null ? user.getLeaveBalance() : 0.0;
            double updatedBalance = Math.max(0.0, currentBalance - request.getTotalDays());
            user.setLeaveBalance(updatedBalance);
            userRepository.save(user);
            log.info("Deducted {} days from user {}. New balance: {}", request.getTotalDays(), user.getName(), updatedBalance);
        }

        return leaveRequestRepository.save(request);
    }

    /**
     * HR Rejection: HR_PENDING -> REJECTED
     */
    public LeaveRequest rejectByHR(Long requestId, DTOs.ReviewActionRequest action) {
        LeaveRequest request = getRequestOrThrow(requestId);

        if (request.getStatus() != LeaveStatus.HR_PENDING) {
            throw new IllegalStateException("Cannot reject request. Expected status HR_PENDING, but was " + request.getStatus());
        }

        LeaveStatus nextState = stateMachineService.processEvent(request, LeaveEvent.HR_REJECT);
        request.setStatus(nextState);
        request.setUpdatedAt(LocalDateTime.now());
        if (action != null && action.getNote() != null && !action.getNote().isBlank()) {
            request.setReason(request.getReason() + " [HR Rejection Note: " + action.getNote() + "]");
        }

        return leaveRequestRepository.save(request);
    }

    /**
     * Automatic / Manual Escalation: MANAGER_PENDING -> HR_PENDING
     * Sets note: "Auto-escalated due to manager timeout."
     */
    public LeaveRequest escalateRequest(Long requestId, String escalationNote) {
        LeaveRequest request = getRequestOrThrow(requestId);

        if (request.getStatus() != LeaveStatus.MANAGER_PENDING) {
            log.warn("Request {} is not in MANAGER_PENDING (current: {}). Skipping escalation.", requestId, request.getStatus());
            return request;
        }

        LeaveStatus nextState = stateMachineService.processEvent(request, LeaveEvent.ESCALATE);
        request.setStatus(nextState);
        request.setEscalationNote(escalationNote != null ? escalationNote : "Auto-escalated due to manager timeout.");
        request.setUpdatedAt(LocalDateTime.now());

        log.info("Escalated request #{} for {} to HR_PENDING. Note: {}",
                request.getId(), request.getUserName(), request.getEscalationNote());

        return leaveRequestRepository.save(request);
    }

    // Query Methods

    @Transactional(readOnly = true)
    public List<LeaveRequest> getMyRequests(Long userId) {
        return leaveRequestRepository.findByUserIdOrderBySubmittedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getPendingForManager(Long managerId) {
        if (managerId == null) {
            return leaveRequestRepository.findByStatusOrderBySubmittedAtDesc(LeaveStatus.MANAGER_PENDING);
        }
        User manager = userRepository.findById(managerId).orElse(null);
        if (manager != null && manager.getTeamId() != null) {
            return leaveRequestRepository.findByTeamIdAndStatusOrderBySubmittedAtDesc(manager.getTeamId(), LeaveStatus.MANAGER_PENDING);
        }
        return leaveRequestRepository.findByStatusOrderBySubmittedAtDesc(LeaveStatus.MANAGER_PENDING);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getPendingForHR() {
        return leaveRequestRepository.findByStatusOrderBySubmittedAtDesc(LeaveStatus.HR_PENDING);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getAllRequests() {
        return leaveRequestRepository.findAll().stream()
                .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeaveRequest> getEscalatedRequests() {
        return leaveRequestRepository.findAll().stream()
                .filter(r -> r.getEscalationNote() != null && !r.getEscalationNote().isBlank())
                .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DTOs.DashboardStats getDashboardStats() {
        List<LeaveRequest> all = leaveRequestRepository.findAll();
        long total = all.size();
        long managerPending = all.stream().filter(r -> r.getStatus() == LeaveStatus.MANAGER_PENDING).count();
        long hrPending = all.stream().filter(r -> r.getStatus() == LeaveStatus.HR_PENDING).count();
        long approved = all.stream().filter(r -> r.getStatus() == LeaveStatus.APPROVED).count();
        long rejected = all.stream().filter(r -> r.getStatus() == LeaveStatus.REJECTED).count();
        long escalated = all.stream().filter(r -> r.getEscalationNote() != null && !r.getEscalationNote().isBlank()).count();
        long conflicts = all.stream().filter(r -> Boolean.TRUE.equals(r.getHasTeamConflict())).count();

        return new DTOs.DashboardStats(total, managerPending, hrPending, approved, rejected, escalated, conflicts);
    }

    private LeaveRequest getRequestOrThrow(Long id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found with id: " + id));
    }
}
