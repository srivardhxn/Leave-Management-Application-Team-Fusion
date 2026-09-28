package com.acentra.leavemanagement.repository;

import com.acentra.leavemanagement.model.Role;
import com.acentra.leavemanagement.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByTeamId(Long teamId);
    long countByTeamId(Long teamId);
    List<User> findByRole(Role role);
}
