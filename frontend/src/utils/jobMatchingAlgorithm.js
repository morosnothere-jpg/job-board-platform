// AI-Powered Job Matching Algorithm
// This calculates how well a job matches a user's profile

/**
 * Main function to calculate job match score
 * @param {Object} userProfile - User's profile data
 * @param {Object} job - Job posting data
 * @returns {Object} - Match score and detailed breakdown
 */
export const calculateJobMatch = (userProfile, job) => {
  if (!userProfile || !job) {
    return {
      score: 0,
      percentage: 0,
      breakdown: {},
      reasons: [],
      warnings: []
    };
  }

  const breakdown = {};
  const reasons = [];
  const warnings = [];

  // 1. SKILLS MATCH (35% weight)
  const skillsMatch = calculateSkillsMatch(userProfile.skills || [], job.requirements || '');
  breakdown.skills = skillsMatch;

  if (skillsMatch.score > 70) {
    reasons.push(`Strong skills match: ${skillsMatch.matchedCount} relevant skills`);
  } else if (skillsMatch.score > 40) {
    reasons.push(`Moderate skills match: ${skillsMatch.matchedCount} relevant skills`);
  } else if (skillsMatch.score > 0) {
    warnings.push(`Limited skills match: Consider developing more relevant skills`);
  }

  // 2. EXPERIENCE MATCH (25% weight)
  const experienceMatch = calculateExperienceMatch(
    userProfile.experience || [],
    job.requirements || '',
    job.title || ''
  );
  breakdown.experience = experienceMatch;

  if (experienceMatch.score > 70) {
    reasons.push(`Your experience aligns well with this role`);
  } else if (experienceMatch.score < 30) {
    warnings.push(`This role may require more experience than you currently have`);
  }

  // 3. LOCATION MATCH (15% weight)
  const locationMatch = calculateLocationMatch(
    userProfile.location || '',
    job.location || '',
    job.job_type || ''
  );
  breakdown.location = locationMatch;

  if (locationMatch.score === 100) {
    reasons.push(`Perfect location match`);
  } else if (locationMatch.score > 50) {
    reasons.push(`Good location compatibility`);
  }

  // 4. JOB TYPE MATCH (10% weight)
  const jobTypeMatch = calculateJobTypeMatch(
    userProfile.availability || '',
    job.job_type || ''
  );
  breakdown.jobType = jobTypeMatch;

  // 5. SALARY MATCH (10% weight)
  const salaryMatch = calculateSalaryMatch(
    userProfile.expected_salary || '',
    job.salary_range || ''
  );
  breakdown.salary = salaryMatch;

  if (salaryMatch.score > 70) {
    reasons.push(`Salary aligns with your expectations`);
  } else if (salaryMatch.score < 30 && salaryMatch.score > 0) {
    warnings.push(`Salary may be below your expectations`);
  }

  // 6. EDUCATION MATCH (5% weight)
  const educationMatch = calculateEducationMatch(
    userProfile.education || [],
    job.requirements || ''
  );
  breakdown.education = educationMatch;

  // Calculate weighted total score
  const totalScore = (
    skillsMatch.score * 0.35 +
    experienceMatch.score * 0.25 +
    locationMatch.score * 0.15 +
    jobTypeMatch.score * 0.10 +
    salaryMatch.score * 0.10 +
    educationMatch.score * 0.05
  );

  return {
    score: Math.round(totalScore),
    percentage: Math.round(totalScore),
    breakdown,
    reasons: reasons.slice(0, 3), // Top 3 reasons
    warnings: warnings.slice(0, 2) // Top 2 warnings
  };
};

/**
 * Calculate skills match score
 */
const calculateSkillsMatch = (userSkills, jobRequirements) => {
  if (!userSkills || userSkills.length === 0) {
    return { score: 0, matchedCount: 0, matchedSkills: [] };
  }

  const jobReqLower = jobRequirements.toLowerCase();
  const matchedSkills = [];
  let matchCount = 0;

  userSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    // Check for exact match or partial match
    if (jobReqLower.includes(skillLower)) {
      matchedSkills.push(skill);
      matchCount++;
    }
  });

  // Score based on percentage of user skills that match
  const matchPercentage = (matchCount / Math.max(userSkills.length, 1)) * 100;

  // Bonus points if multiple skills match
  const bonusPoints = Math.min(matchCount * 10, 30);

  const score = Math.min(matchPercentage + bonusPoints, 100);

  return {
    score: Math.round(score),
    matchedCount: matchCount,
    matchedSkills
  };
};

/**
 * Calculate experience match score
 */
const calculateExperienceMatch = (userExperience, jobRequirements, jobTitle) => {
  if (!userExperience || userExperience.length === 0) {
    return { score: 20, yearsOfExperience: 0 }; // Base score for no experience
  }

  // Calculate total years of experience
  let totalMonths = 0;
  userExperience.forEach(exp => {
    if (exp.start_date) {
      const start = new Date(exp.start_date);
      const end = exp.current ? new Date() : new Date(exp.end_date || new Date());
      const months = (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += Math.max(months, 0);
    }
  });

  const yearsOfExperience = totalMonths / 12;

  // Extract experience requirements from job posting
  const requirementsLower = (jobRequirements + ' ' + jobTitle).toLowerCase();
  let requiredYears = 0;

  // Look for patterns like "5 years", "5+ years", "3-5 years"
  const yearPatterns = [
    /(\d+)\+?\s*years?/gi,
    /(\d+)\s*-\s*(\d+)\s*years?/gi
  ];

  yearPatterns.forEach(pattern => {
    const matches = requirementsLower.match(pattern);
    if (matches) {
      const numbers = matches[0].match(/\d+/g);
      if (numbers) {
        requiredYears = Math.max(requiredYears, parseInt(numbers[0]));
      }
    }
  });

  // Check for seniority level indicators
  let seniorityMultiplier = 1;
  if (requirementsLower.includes('senior') || requirementsLower.includes('lead')) {
    seniorityMultiplier = 1.5;
    requiredYears = Math.max(requiredYears, 5);
  } else if (requirementsLower.includes('junior') || requirementsLower.includes('entry')) {
    seniorityMultiplier = 0.5;
    requiredYears = Math.max(requiredYears, 1);
  } else if (requirementsLower.includes('mid-level') || requirementsLower.includes('intermediate')) {
    requiredYears = Math.max(requiredYears, 3);
  }

  // Calculate score based on experience match
  let score = 50; // Base score

  if (requiredYears === 0) {
    // No specific requirement, give points for any experience
    score = Math.min(50 + (yearsOfExperience * 10), 100);
  } else {
    const experienceRatio = yearsOfExperience / requiredYears;

    if (experienceRatio >= 1) {
      // Has required experience or more
      score = Math.min(80 + (experienceRatio * 10), 100);
    } else if (experienceRatio >= 0.7) {
      // Close to required experience
      score = 60 + (experienceRatio * 20);
    } else {
      // Below required experience
      score = 30 + (experienceRatio * 30);
    }
  }

  // Check for relevant position titles
  const relevantExperience = userExperience.some(exp => {
    const positionLower = (exp.position || '').toLowerCase();
    const titleLower = jobTitle.toLowerCase();

    // Check if position title has similar keywords
    const titleWords = titleLower.split(' ').filter(w => w.length > 3);
    return titleWords.some(word => positionLower.includes(word));
  });

  if (relevantExperience) {
    score = Math.min(score + 15, 100);
  }

  return {
    score: Math.round(score),
    yearsOfExperience: Math.round(yearsOfExperience * 10) / 10
  };
};

/**
 * Calculate location match score
 */
const calculateLocationMatch = (userLocation, jobLocation, jobType) => {
  // Remote jobs always score 100
  if (jobType && jobType.toLowerCase().includes('remote')) {
    return { score: 100, reason: 'Remote position' };
  }

  if (!userLocation || !jobLocation) {
    return { score: 50, reason: 'Location not specified' };
  }

  const userLoc = userLocation.toLowerCase().trim();
  const jobLoc = jobLocation.toLowerCase().trim();

  // Exact match
  if (userLoc === jobLoc) {
    return { score: 100, reason: 'Exact location match' };
  }

  // Check if same city
  const userCity = userLoc.split(',')[0].trim();
  const jobCity = jobLoc.split(',')[0].trim();

  if (userCity === jobCity) {
    return { score: 95, reason: 'Same city' };
  }

  // Check if same state/region
  if (userLoc.includes(jobCity) || jobLoc.includes(userCity)) {
    return { score: 70, reason: 'Same region' };
  }

  // Check if same country
  const userCountry = userLoc.split(',').pop().trim();
  const jobCountry = jobLoc.split(',').pop().trim();

  if (userCountry === jobCountry) {
    return { score: 50, reason: 'Same country' };
  }

  return { score: 30, reason: 'Different location' };
};

/**
 * Calculate job type match score
 */
const calculateJobTypeMatch = (userAvailability, jobType) => {
  if (!userAvailability || !jobType) {
    return { score: 70 }; // Neutral score if not specified
  }

  const availLower = userAvailability.toLowerCase();
  const typeLower = jobType.toLowerCase();

  // Perfect match scenarios
  if (typeLower.includes('remote') || availLower.includes('remote')) {
    return { score: 100 };
  }

  if (availLower.includes('not actively looking') && !availLower.includes('available')) {
    return { score: 40 }; // Lower score if not actively looking
  }

  if (availLower.includes('available')) {
    if (typeLower.includes('full-time') || typeLower.includes('full time')) {
      return { score: 100 };
    }
    if (typeLower.includes('part-time') || typeLower.includes('part time')) {
      return { score: 85 };
    }
    if (typeLower.includes('contract')) {
      return { score: 80 };
    }
  }

  return { score: 70 };
};

/**
 * Calculate salary match score
 */
const calculateSalaryMatch = (expectedSalary, jobSalaryRange) => {
  if (!expectedSalary || !jobSalaryRange) {
    return { score: 70 }; // Neutral score if not specified
  }

  // Extract numbers from strings
  const extractNumber = (str) => {
    const numbers = str.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : 0;
  };

  const expected = extractNumber(expectedSalary);
  const jobSalary = extractNumber(jobSalaryRange);

  if (expected === 0 || jobSalary === 0) {
    return { score: 70 };
  }

  const ratio = jobSalary / expected;

  if (ratio >= 1) {
    // Job pays equal or more than expected
    return { score: 100 };
  } else if (ratio >= 0.9) {
    // Within 10% of expected
    return { score: 85 };
  } else if (ratio >= 0.8) {
    // Within 20% of expected
    return { score: 70 };
  } else if (ratio >= 0.7) {
    // Within 30% of expected
    return { score: 50 };
  } else {
    // More than 30% below expected
    return { score: 30 };
  }
};

/**
 * Calculate education match score
 */
const calculateEducationMatch = (userEducation, jobRequirements) => {
  if (!userEducation || userEducation.length === 0) {
    return { score: 50 }; // Neutral score for no education
  }

  const reqLower = jobRequirements.toLowerCase();
  let score = 60; // Base score for having education

  // Check for degree requirements
  const degrees = {
    'phd': 100,
    'doctorate': 100,
    'master': 85,
    'bachelor': 70,
    'associate': 60
  };

  // Find highest degree user has
  let userHighestDegree = 0;
  userEducation.forEach(edu => {
    const degreeLower = (edu.degree || '').toLowerCase();
    Object.keys(degrees).forEach(degreeType => {
      if (degreeLower.includes(degreeType)) {
        userHighestDegree = Math.max(userHighestDegree, degrees[degreeType]);
      }
    });
  });

  // Check what job requires
  let requiredDegree = 0;
  Object.keys(degrees).forEach(degreeType => {
    if (reqLower.includes(degreeType)) {
      requiredDegree = Math.max(requiredDegree, degrees[degreeType]);
    }
  });

  if (requiredDegree === 0) {
    // No specific degree required
    return { score: userHighestDegree || 70 };
  }

  if (userHighestDegree >= requiredDegree) {
    return { score: 100 };
  } else if (userHighestDegree > 0) {
    // Has a degree but lower than required
    return { score: 60 };
  }

  return { score: 40 };
};

/**
 * Get match level description
 */
export const getMatchLevel = (percentage) => {
  if (percentage >= 85) return { level: 'Excellent', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900' };
  if (percentage >= 70) return { level: 'Great', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900' };
  if (percentage >= 55) return { level: 'Good', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900' };
  if (percentage >= 40) return { level: 'Fair', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900' };
  return { level: 'Low', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' };
};