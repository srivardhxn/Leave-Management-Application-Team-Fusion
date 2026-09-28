package com.acentra.leavemanagement.controller;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class DTOs {

    public static class ApplyLeaveRequest {
        @NotNull(message = "userId is required")
        private Long userId;

        @NotNull(message = "startDate is required")
        private LocalDate startDate;

        @NotNull(message = "endDate is required")
        private LocalDate endDate;

        private String reason;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class ReviewActionRequest {
        private Long reviewerId;
        private String note;

        public Long getReviewerId() { return reviewerId; }
        public void setReviewerId(Long reviewerId) { this.reviewerId = reviewerId; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class ConflictCheckResult {
        private boolean hasConflict;
        private double conflictPercentage;
        private int conflictingMembersCount;
        private int totalTeamMembers;
        private List<String> conflictingTeammates;
        private String details;

        public ConflictCheckResult(boolean hasConflict, double conflictPercentage, int conflictingMembersCount, int totalTeamMembers, List<String> conflictingTeammates, String details) {
            this.hasConflict = hasConflict;
            this.conflictPercentage = conflictPercentage;
            this.conflictingMembersCount = conflictingMembersCount;
            this.totalTeamMembers = totalTeamMembers;
            this.conflictingTeammates = conflictingTeammates;
            this.details = details;
        }

        public boolean isHasConflict() { return hasConflict; }
        public double getConflictPercentage() { return conflictPercentage; }
        public int getConflictingMembersCount() { return conflictingMembersCount; }
        public int getTotalTeamMembers() { return totalTeamMembers; }
        public List<String> getConflictingTeammates() { return conflictingTeammates; }
        public String getDetails() { return details; }
    }

    public static class DashboardStats {
        private long totalRequests;
        private long pendingManager;
        private long pendingHR;
        private long approved;
        private long rejected;
        private long escalated;
        private long conflictCount;

        public DashboardStats(long totalRequests, long pendingManager, long pendingHR, long approved, long rejected, long escalated, long conflictCount) {
            this.totalRequests = totalRequests;
            this.pendingManager = pendingManager;
            this.pendingHR = pendingHR;
            this.approved = approved;
            this.rejected = rejected;
            this.escalated = escalated;
            this.conflictCount = conflictCount;
        }

        public long getTotalRequests() { return totalRequests; }
        public long getPendingManager() { return pendingManager; }
        public long getPendingHR() { return pendingHR; }
        public long getApproved() { return approved; }
        public long getRejected() { return rejected; }
        public long getEscalated() { return escalated; }
        public long getConflictCount() { return conflictCount; }
    }
}
