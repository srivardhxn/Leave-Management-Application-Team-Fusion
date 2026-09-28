package com.acentra.leavemanagement.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "app_users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private Long teamId;

    @Column(nullable = false)
    private String teamName;

    @Column(nullable = false)
    private LocalDate joinDate;

    @Column(nullable = false)
    private Double leaveBalance;

    private String jobTitle;

    private String avatar;

    public User() {
    }

    public User(Long id, String name, String email, Role role, Long teamId, String teamName, LocalDate joinDate, Double leaveBalance, String jobTitle, String avatar) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.teamId = teamId;
        this.teamName = teamName;
        this.joinDate = joinDate;
        this.leaveBalance = leaveBalance;
        this.jobTitle = jobTitle;
        this.avatar = avatar;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
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

    public LocalDate getJoinDate() {
        return joinDate;
    }

    public void setJoinDate(LocalDate joinDate) {
        this.joinDate = joinDate;
    }

    public Double getLeaveBalance() {
        return leaveBalance;
    }

    public void setLeaveBalance(Double leaveBalance) {
        this.leaveBalance = leaveBalance;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
}
