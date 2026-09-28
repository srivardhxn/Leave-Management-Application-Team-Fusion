package com.acentra.leavemanagement.controller;

import com.acentra.leavemanagement.model.User;
import com.acentra.leavemanagement.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Lists all mock users for the Live Role Switcher in UI.
     */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    /**
     * Mock login returning a user object for hackathon speed and demonstration.
     */
    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestBody(required = false) Map<String, Object> body,
                                      @RequestParam(required = false) Long userId) {
        Long targetId = userId;
        if (targetId == null && body != null && body.containsKey("userId")) {
            targetId = Long.valueOf(body.get("userId").toString());
        }
        if (targetId == null) {
            return ResponseEntity.ok(userRepository.findAll().stream().findFirst().orElseThrow());
        }

        final Long finalTargetId = targetId;
        User user = userRepository.findById(finalTargetId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + finalTargetId));
        return ResponseEntity.ok(user);
    }

    /**
     * Returns current user details.
     */
    @GetMapping("/user/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
