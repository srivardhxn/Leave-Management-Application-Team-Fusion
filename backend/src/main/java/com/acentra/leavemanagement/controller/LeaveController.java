package com.acentra.leavemanagement.controller;

import com.acentra.leavemanagement.model.LeaveRequest;
import com.acentra.leavemanagement.model.Role;
import com.acentra.leavemanagement.model.User;
import com.acentra.leavemanagement.repository.UserRepository;
import com.acentra.leavemanagement.scheduler.EscalationScheduler;
import com.acentra.leavemanagement.service.LeaveService;
import com.acentra.leavemanagement.service.ProRataLeaveCalculator;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;
    private final UserRepository userRepository;
    private final ProRataLeaveCalculator proRataCalculator;
    private final EscalationScheduler escalationScheduler;

    public LeaveController(LeaveService leaveService,
                           UserRepository userRepository,
                           ProRataLeaveCalculator proRataCalculator,
                           EscalationScheduler escalationScheduler) {
        this.leaveService = leaveService;
        this.userRepository = userRepository;
        this.proRataCalculator = proRataCalculator;
        this.escalationScheduler = escalationScheduler;
    }

    /**
     * Submit leave request.
     * Evaluates conflict (>20% of team on leave) & pro-rata balance.
     */
    @PostMapping("/apply")
    public ResponseEntity<LeaveRequest> applyLeave(@Valid @RequestBody DTOs.ApplyLeaveRequest requestDto) {
        LeaveRequest created = leaveService.applyLeave(requestDto);
        return ResponseEntity.ok(created);
    }

    /**
     * Get leaves for current logged-in employee.
     */
    @GetMapping("/my-requests")
    public ResponseEntity<List<LeaveRequest>> getMyRequests(@RequestParam Long userId) {
        return ResponseEntity.ok(leaveService.getMyRequests(userId));
    }

    /**
     * Get pending leaves for Manager review.
     * Displays team conflict warnings prominently.
     */
    @GetMapping("/manager/pending")
    public ResponseEntity<List<LeaveRequest>> getManagerPending(@RequestParam(required = false) Long managerId) {
        return ResponseEntity.ok(leaveService.getPendingForManager(managerId));
    }

    /**
     * Get pending leaves for HR final review.
     */
    @GetMapping("/hr/pending")
    public ResponseEntity<List<LeaveRequest>> getHRPending() {
        return ResponseEntity.ok(leaveService.getPendingForHR());
    }

    /**
     * Get all escalated requests (highlighted in HR view).
     */
    @GetMapping("/hr/escalated")
    public ResponseEntity<List<LeaveRequest>> getEscalatedRequests() {
        return ResponseEntity.ok(leaveService.getEscalatedRequests());
    }

    /**
     * Approve leave request (Manager or HR, based on current state).
     */
    @PostMapping("/approve/{id}")
    public ResponseEntity<LeaveRequest> approveLeave(@PathVariable Long id,
                                                    @RequestBody(required = false) DTOs.ReviewActionRequest action) {
        LeaveRequest existing = leaveService.getAllRequests().stream()
                .filter(r -> r.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + id));

        LeaveRequest result;
        if (existing.getStatus() == com.acentra.leavemanagement.model.LeaveStatus.MANAGER_PENDING) {
            result = leaveService.approveByManager(id, action);
        } else if (existing.getStatus() == com.acentra.leavemanagement.model.LeaveStatus.HR_PENDING) {
            result = leaveService.approveByHR(id, action);
        } else {
            throw new IllegalStateException("Request is in terminal state: " + existing.getStatus());
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Reject leave request (Manager or HR).
     */
    @PostMapping("/reject/{id}")
    public ResponseEntity<LeaveRequest> rejectLeave(@PathVariable Long id,
                                                   @RequestBody(required = false) DTOs.ReviewActionRequest action) {
        LeaveRequest existing = leaveService.getAllRequests().stream()
                .filter(r -> r.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + id));

        LeaveRequest result;
        if (existing.getStatus() == com.acentra.leavemanagement.model.LeaveStatus.MANAGER_PENDING) {
            result = leaveService.rejectByManager(id, action);
        } else if (existing.getStatus() == com.acentra.leavemanagement.model.LeaveStatus.HR_PENDING) {
            result = leaveService.rejectByHR(id, action);
        } else {
            throw new IllegalStateException("Request is in terminal state: " + existing.getStatus());
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Manual escalation trigger for instant demoing.
     */
    @PostMapping("/escalate/{id}")
    public ResponseEntity<LeaveRequest> escalateRequest(@PathVariable Long id,
                                                        @RequestBody(required = false) Map<String, String> body) {
        String note = (body != null && body.containsKey("note"))
                ? body.get("note")
                : "Auto-escalated due to manager timeout.";
        LeaveRequest escalated = leaveService.escalateRequest(id, note);
        return ResponseEntity.ok(escalated);
    }

    /**
     * Trigger background escalation scheduler run immediately.
     */
    @PostMapping("/trigger-escalation")
    public ResponseEntity<Map<String, Object>> triggerEscalation() {
        int count = escalationScheduler.checkAndEscalate();
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "escalatedCount", count,
                "message", count > 0 ? "Escalated " + count + " requests" : "No overdue requests found"
        ));
    }

    /**
     * Real-time pre-flight conflict check for employee form.
     */
    @GetMapping("/conflict-check")
    public ResponseEntity<DTOs.ConflictCheckResult> checkConflict(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return ResponseEntity.ok(leaveService.evaluateTeamConflict(userId, user.getTeamId(), startDate, endDate));
    }

    /**
     * Dashboard analytics and stats.
     */
    @GetMapping("/stats")
    public ResponseEntity<DTOs.DashboardStats> getStats() {
        return ResponseEntity.ok(leaveService.getDashboardStats());
    }

    /**
     * All requests across company (for HR overview / audit log).
     */
    @GetMapping("/all")
    public ResponseEntity<List<LeaveRequest>> getAllRequests() {
        return ResponseEntity.ok(leaveService.getAllRequests());
    }

    /**
     * Pro-Rata calculator utility endpoint for judges to test any date!
     */
    @GetMapping("/pro-rata-calculator")
    public ResponseEntity<ProRataLeaveCalculator.ProRataBreakdown> calculateProRata(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate joinDate,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false, defaultValue = "24.0") Double allowance) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(proRataCalculator.getBreakdown(joinDate, targetYear, allowance));
    }
}
