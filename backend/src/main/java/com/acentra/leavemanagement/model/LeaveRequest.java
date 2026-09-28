package com.acentra.leavemanagement.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private String userName;

    private String userAvatar;

    @Column(nullable = false)
    private Long teamId;

    private String teamName;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Integer totalDays;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveStatus status;

    @Column(length = 1000)
    private String reason;

    @Column(nullable = false)
    private Boolean hasTeamConflict = false;

    @Column(length = 2000)
    private String conflictDetails;

    @Column(length = 1000)
    private String escalationNote;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    private LocalDateTime updatedAt;

    public LeaveRequest() {
    }

    public LeaveRequest(Long id, Long userId, String userName, String userAvatar, Long teamId, String teamName,
                        LocalDate startDate, LocalDate endDate, Integer totalDays, LeaveStatus status,
                        String reason, Boolean hasTeamConflict, String conflictDetails, String escalationNote,
                        LocalDateTime submittedAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userAvatar = userAvatar;
        this.teamId = teamId;
        this.teamName = teamName;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalDays = totalDays;
        this.status = status;
        this.reason = reason;
        this.hasTeamConflict = hasTeamConflict != null ? hasTeamConflict : false;
        this.conflictDetails = conflictDetails;
        this.escalationNote = escalationNote;
        this.submittedAt = submittedAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    public void prePersist() {
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = LocalDateTime.now();
        }
        if (this.hasTeamConflict == null) {
            this.hasTeamConflict = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserAvatar() {
        return userAvatar;
    }

    public void setUserAvatar(String userAvatar) {
        this.userAvatar = userAvatar;
    }

    public Long getTeamId() {
        return teamId;
    }

    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public Integer getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Integer totalDays) {
        this.totalDays = totalDays;
    }

    public LeaveStatus getStatus() {
        return status;
    }

    public void setStatus(LeaveStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Boolean getHasTeamConflict() {
        return hasTeamConflict;
    }

    public void setHasTeamConflict(Boolean hasTeamConflict) {
        this.hasTeamConflict = hasTeamConflict;
    }

    public String getConflictDetails() {
        return conflictDetails;
    }

    public void setConflictDetails(String conflictDetails) {
        this.conflictDetails = conflictDetails;
    }

    public String getEscalationNote() {
        return escalationNote;
    }

    public void setEscalationNote(String escalationNote) {
        this.escalationNote = escalationNote;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
