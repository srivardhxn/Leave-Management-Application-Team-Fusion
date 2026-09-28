package com.acentra.leavemanagement.repository;

import com.acentra.leavemanagement.model.LeaveRequest;
import com.acentra.leavemanagement.model.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByUserIdOrderBySubmittedAtDesc(Long userId);

    List<LeaveRequest> findByTeamIdOrderBySubmittedAtDesc(Long teamId);

    List<LeaveRequest> findByTeamIdAndStatusOrderBySubmittedAtDesc(Long teamId, LeaveStatus status);

    List<LeaveRequest> findByStatusOrderBySubmittedAtDesc(LeaveStatus status);

    List<LeaveRequest> findByStatusInOrderBySubmittedAtDesc(Collection<LeaveStatus> statuses);

    List<LeaveRequest> findByStatusAndSubmittedAtBefore(LeaveStatus status, LocalDateTime threshold);

    /**
     * Smart Conflict Detection Query:
     * Finds active leave requests for the same team that overlap with the requested date range,
     * excluding the user requesting leave.
     */
    @Query("SELECT lr FROM LeaveRequest lr " +
           "WHERE lr.teamId = :teamId " +
           "AND lr.userId <> :excludeUserId " +
           "AND lr.status IN :activeStatuses " +
           "AND lr.startDate <= :endDate " +
           "AND lr.endDate >= :startDate")
    List<LeaveRequest> findOverlappingTeamLeaves(
            @Param("teamId") Long teamId,
            @Param("excludeUserId") Long excludeUserId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("activeStatuses") Collection<LeaveStatus> activeStatuses
    );
}
