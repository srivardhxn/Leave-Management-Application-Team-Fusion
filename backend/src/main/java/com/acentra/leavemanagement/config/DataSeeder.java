package com.acentra.leavemanagement.config;

import com.acentra.leavemanagement.model.LeaveRequest;
import com.acentra.leavemanagement.model.LeaveStatus;
import com.acentra.leavemanagement.model.Role;
import com.acentra.leavemanagement.model.User;
import com.acentra.leavemanagement.repository.LeaveRequestRepository;
import com.acentra.leavemanagement.repository.UserRepository;
import com.acentra.leavemanagement.service.ProRataLeaveCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final ProRataLeaveCalculator proRataCalculator;

    public DataSeeder(UserRepository userRepository,
                      LeaveRequestRepository leaveRequestRepository,
                      ProRataLeaveCalculator proRataCalculator) {
        this.userRepository = userRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.proRataCalculator = proRataCalculator;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping initial seeding.");
            return;
        }

        log.info("==========================================================");
        log.info("SEEDING H2 DATABASE FOR HACKATHON DEMO");
        log.info("==========================================================");

        int currentYear = LocalDate.now().getYear();

        // 1 HR User
        User hrUser = new User(
                null,
                "Sarah Jenkins",
                "sarah.jenkins@company.com",
                Role.HR,
                0L,
                "People Operations / HR",
                LocalDate.of(2022, 1, 15),
                24.0,
                "Chief People Officer",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
        );
        hrUser = userRepository.save(hrUser);

        // 2 Managers
        User mgrAlpha = new User(
                null,
                "Alex Mercer",
                "alex.mercer@company.com",
                Role.MANAGER,
                1L,
                "Team Alpha (Engineering)",
                LocalDate.of(2023, 3, 1),
                24.0,
                "VP of Engineering",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        );
        mgrAlpha = userRepository.save(mgrAlpha);

        User mgrBeta = new User(
                null,
                "Elena Vance",
                "elena.vance@company.com",
                Role.MANAGER,
                2L,
                "Team Beta (Design & Product)",
                LocalDate.of(2023, 6, 1),
                24.0,
                "Head of Design",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        );
        mgrBeta = userRepository.save(mgrBeta);

        // 5 Employees across 2 teams with Pro-Rata calculation
        // Team Alpha (Engineering)
        LocalDate emp1Join = LocalDate.of(currentYear, 1, 10);
        double emp1Balance = proRataCalculator.calculateProRata(emp1Join, currentYear, 24.0);
        User emp1 = userRepository.save(new User(
                null,
                "David Chen",
                "david.chen@company.com",
                Role.EMPLOYEE,
                1L,
                "Team Alpha (Engineering)",
                emp1Join,
                emp1Balance,
                "Staff Backend Engineer",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
        ));

        LocalDate emp2Join = LocalDate.of(currentYear, 3, 1);
        double emp2Balance = proRataCalculator.calculateProRata(emp2Join, currentYear, 24.0);
        User emp2 = userRepository.save(new User(
                null,
                "Marcus Brody",
                "marcus.brody@company.com",
                Role.EMPLOYEE,
                1L,
                "Team Alpha (Engineering)",
                emp2Join,
                emp2Balance,
                "Senior Frontend Engineer",
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
        ));

        // Requirement: "if total leave is 24 days, and they join on July 1, they get 12 days."
        LocalDate emp3Join = LocalDate.of(currentYear, 7, 1);
        double emp3Balance = proRataCalculator.calculateProRata(emp3Join, currentYear, 24.0); // Exact 12.0 days!
        User emp3 = userRepository.save(new User(
                null,
                "Priya Sharma",
                "priya.sharma@company.com",
                Role.EMPLOYEE,
                1L,
                "Team Alpha (Engineering)",
                emp3Join,
                emp3Balance,
                "Full Stack Engineer",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
        ));

        // Team Beta (Design & Product)
        LocalDate emp4Join = LocalDate.of(currentYear, 2, 15);
        double emp4Balance = proRataCalculator.calculateProRata(emp4Join, currentYear, 24.0);
        User emp4 = userRepository.save(new User(
                null,
                "Chloe Zhao",
                "chloe.zhao@company.com",
                Role.EMPLOYEE,
                2L,
                "Team Beta (Design & Product)",
                emp4Join,
                emp4Balance,
                "Senior Product Designer",
                "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
        ));

        LocalDate emp5Join = LocalDate.of(currentYear, 8, 1);
        double emp5Balance = proRataCalculator.calculateProRata(emp5Join, currentYear, 24.0);
        User emp5 = userRepository.save(new User(
                null,
                "Liam O'Connor",
                "liam.oconnor@company.com",
                Role.EMPLOYEE,
                2L,
                "Team Beta (Design & Product)",
                emp5Join,
                emp5Balance,
                "UX Researcher & Content Lead",
                "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"
        ));

        log.info("Seeded 8 Users across 2 teams (1 HR, 2 Managers, 5 Employees)");
        log.info("Priya Sharma (Join July 1): Calculated Pro-Rata Balance = {} days (Expected: 12.0)", emp3Balance);

        // Seed 3 Mock Leave Requests (as required by prompt)
        // Request 1: David Chen (APPROVED, upcoming dates)
        LocalDate today = LocalDate.now();
        LeaveRequest req1 = new LeaveRequest(
                null,
                emp1.getId(),
                emp1.getName(),
                emp1.getAvatar(),
                emp1.getTeamId(),
                emp1.getTeamName(),
                today.plusDays(10),
                today.plusDays(13),
                4,
                LeaveStatus.APPROVED,
                "Attending family wedding and visiting grandparents",
                false,
                null,
                null,
                LocalDateTime.now().minusDays(3),
                LocalDateTime.now().minusDays(1)
        );
        leaveRequestRepository.save(req1);

        // Request 2: Marcus Brody (MANAGER_PENDING with TEAM CONFLICT!)
        // Overlaps with David Chen's dates in Team Alpha!
        LeaveRequest req2 = new LeaveRequest(
                null,
                emp2.getId(),
                emp2.getName(),
                emp2.getAvatar(),
                emp2.getTeamId(),
                emp2.getTeamName(),
                today.plusDays(11),
                today.plusDays(14),
                4,
                LeaveStatus.MANAGER_PENDING,
                "Attending AWS Cloud Architecture Summit and workshop",
                true, // Team conflict flag active!
                "Team Capacity Warning: 50.0% of team (2/4 members) concurrently away. Overlapping teammates: David Chen",
                null,
                LocalDateTime.now().minusSeconds(50),
                LocalDateTime.now().minusSeconds(50)
        );
        leaveRequestRepository.save(req2);

        // Request 3: Liam O'Connor (HR_PENDING with Auto-Escalation Note)
        LeaveRequest req3 = new LeaveRequest(
                null,
                emp5.getId(),
                emp5.getName(),
                emp5.getAvatar(),
                emp5.getTeamId(),
                emp5.getTeamName(),
                today.plusDays(20),
                today.plusDays(24),
                5,
                LeaveStatus.HR_PENDING,
                "Apartment lease renewal and cross-city relocation",
                false,
                null,
                "Auto-escalated due to manager timeout.",
                LocalDateTime.now().minusMinutes(5),
                LocalDateTime.now().minusMinutes(3)
        );
        leaveRequestRepository.save(req3);

        // Request 4: Priya Sharma (MANAGER_PENDING aged 2m 15s to trigger live escalation demo)
        LeaveRequest req4 = new LeaveRequest(
                null,
                emp3.getId(),
                emp3.getName(),
                emp3.getAvatar(),
                emp3.getTeamId(),
                emp3.getTeamName(),
                today.plusDays(12),
                today.plusDays(13),
                2,
                LeaveStatus.MANAGER_PENDING,
                "Short personal wellness retreat",
                true,
                "Team Capacity Warning: 75.0% of team (3/4 members) concurrently away. Overlapping teammates: David Chen, Marcus Brody",
                null,
                LocalDateTime.now().minusMinutes(2).minusSeconds(15),
                LocalDateTime.now().minusMinutes(2).minusSeconds(15)
        );
        leaveRequestRepository.save(req4);

        log.info("Seeded 4 Mock Leave Requests demonstrating: Approved, Team Conflict, and Auto-Escalation!");
        log.info("==========================================================");
    }
}
