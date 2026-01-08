"""
Random Serial Dictatorship (RSD) Algorithm for the Lottery Engine.

This module implements a deterministic, reproducible matching algorithm
that assigns youth to jobs based on their ranked preferences.

The algorithm:
1. Shuffle applicants using a seeded random number generator (reproducibility)
2. Iterate through applicants in shuffled order
3. For each applicant, try to assign their #1 choice, then #2, etc.
4. If no job available, add to reserve list

CRITICAL: Same seed + same inputs = same results (auditable)
"""
import random
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class MatchResult:
    """Result of the RSD algorithm execution."""
    matches: Dict[str, str]  # youth_id -> job_id
    reserves: List[str]  # youth_ids that couldn't be matched
    job_status: Dict[str, int]  # job_id -> remaining spots
    seed: int
    engine_version: str = "1.0.0"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "matches": self.matches,
            "reserves": self.reserves,
            "job_status": self.job_status,
            "seed": self.seed,
            "engine_version": self.engine_version,
        }


class RSDMatchEngine:
    """
    Random Serial Dictatorship Match Engine.

    This engine implements a fair lottery algorithm where:
    - Each applicant is randomly assigned a priority order
    - Applicants are processed in priority order
    - Each applicant gets their highest-ranked available job

    The algorithm is deterministic given the same seed and inputs.
    """

    ENGINE_VERSION = "1.0.0"

    def __init__(
        self,
        applicants: List[Dict[str, Any]],
        jobs: List[Dict[str, Any]],
        seed: Optional[int] = None
    ):
        """
        Initialize the match engine.

        Args:
            applicants: List of dicts with format:
                { "id": "uuid", "choices": ["job_id_1", "job_id_2", ...] }
                Choices are ordered by preference (index 0 = first choice)
            jobs: List of dicts with format:
                { "id": "uuid", "total_spots": 5 }
            seed: Random seed for reproducibility. If None, uses random seed.
        """
        self.applicants = applicants.copy()  # Don't mutate input
        self.jobs = {j["id"]: j for j in jobs}

        # Track remaining spots per job
        self.job_capacities = {j["id"]: j["total_spots"] for j in jobs}

        # Set up reproducible randomness
        self.seed = seed if seed is not None else random.randint(0, 2**31 - 1)
        self._rng = random.Random(self.seed)

    def run(self) -> MatchResult:
        """
        Execute the Random Serial Dictatorship algorithm.

        Returns:
            MatchResult containing matches, reserves, and job status
        """
        matches: Dict[str, str] = {}
        reserves: List[str] = []

        # 1. Create a working copy and shuffle using seeded RNG
        # This is the "Lottery" part - random priority order
        applicants_shuffled = self.applicants.copy()
        self._rng.shuffle(applicants_shuffled)

        # 2. Process each applicant in shuffled order (The "Dictatorship" part)
        for applicant in applicants_shuffled:
            applicant_id = applicant["id"]
            choices = applicant.get("choices", [])
            assigned = False

            # Try their choices in preference order (Rank 1, Rank 2, ...)
            for job_id in choices:
                remaining_spots = self.job_capacities.get(job_id, 0)

                if remaining_spots > 0:
                    # Match found! Assign this job
                    matches[applicant_id] = job_id
                    self.job_capacities[job_id] -= 1
                    assigned = True
                    break

            # If no job was available (or they had no choices), add to reserves
            if not assigned:
                reserves.append(applicant_id)

        return MatchResult(
            matches=matches,
            reserves=reserves,
            job_status=self.job_capacities.copy(),
            seed=self.seed,
            engine_version=self.ENGINE_VERSION,
        )

    def get_audit_report(self, result: MatchResult) -> Dict[str, Any]:
        """
        Generate a detailed audit report for transparency.

        This report contains all information needed to verify
        that the lottery was run fairly and can be reproduced.
        """
        return {
            "engine_version": self.ENGINE_VERSION,
            "seed": self.seed,
            "input_summary": {
                "total_applicants": len(self.applicants),
                "total_jobs": len(self.jobs),
                "total_spots": sum(j["total_spots"] for j in self.jobs.values()),
            },
            "output_summary": {
                "matched_count": len(result.matches),
                "reserve_count": len(result.reserves),
                "remaining_spots": sum(result.job_status.values()),
            },
            "matches": result.matches,
            "reserves": result.reserves,
            "job_status": result.job_status,
        }
