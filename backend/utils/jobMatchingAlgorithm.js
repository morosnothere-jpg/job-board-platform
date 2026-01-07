// Backend AI-Powered Job Matching Algorithm
// This runs on the server and matches against ALL jobs in the database

/**
 * Calculate match score between user profile and job
 * @param {Object} userProfile - User's complete profile
 * @param {Object} job - Job posting
 * @returns {Object} - Match score and reasons
 */
const calculateJobMatch = (userProfile, job) => {
  if (!userProfile || !job) {
    return { score: 0, reasons: [] };
  }

  const reasons = [];
  let totalScore = 0;

  // 1. SKILLS MATCH (35% weight)
  const skillsScore = calculateSkillsMatch(
    userProfile.skills || [],
    job.requirements || '',
    job.description || ''
  );
  totalScore += skillsScore.score * 0.35;
  if (skillsScore.matchedCount > 0) {
    reasons.push(`${skillsScore.matchedCount} matching skills`);
  }

  // 2. EXPERIENCE MATCH (25% weight)
  const experienceScore = calculateExperienceMatch(
    userProfile.experience || [],
    job.requirements || '',
    job.title || ''
  );
  totalScore += experienceScore.score * 0.25;
  if (experienceScore.score > 70) {
    reasons.push(`Strong experience match`);
  }

  // 3. LOCATION MATCH (15% weight)
  const locationScore = calculateLocationMatch(
    userProfile.location || '',
    job.location || '',
    job.work_mode || ''
  );
  totalScore += locationScore.score * 0.15;
  if (locationScore.score === 100) {
    reasons.push(`Perfect location match`);
  }

  // 4. JOB TYPE MATCH (10% weight)
  const jobTypeScore = calculateJobTypeMatch(
    userProfile.availability || '',
    job.job_type || ''
  );
  totalScore += jobTypeScore.score * 0.10;

  // 5. SALARY MATCH (10% weight)
  const salaryScore = calculateSalaryMatch(
    userProfile.expected_salary || '',
    job.salary_range || ''
  );
  totalScore += salaryScore.score * 0.10;
  if (salaryScore.score > 80) {
    reasons.push(`Salary aligns with expectations`);
  }

  // 6. EDUCATION MATCH (5% weight)
  const educationScore = calculateEducationMatch(
    userProfile.education || [],
    job.requirements || ''
  );
  totalScore += educationScore.score * 0.05;

  return {
    score: Math.round(totalScore),
    reasons: reasons.slice(0, 3) // Top 3 reasons
  };
};

/**
 * Calculate skills match
 */
const calculateSkillsMatch = (userSkills, jobRequirements, jobDescription) => {
  if (!userSkills || userSkills.length === 0) {
    return { score: 0, matchedCount: 0 };
  }

  const combinedText = (jobRequirements + ' ' + jobDescription).toLowerCase();
  let matchCount = 0;

  userSkills.forEach(skill => {
    if (combinedText.includes(skill.toLowerCase())) {
      matchCount++;
    }
  });

  const matchPercentage = (matchCount / userSkills.length) * 100;
  const bonusPoints = Math.min(matchCount * 10, 30);
  const score = Math.min(matchPercentage + bonusPoints, 100);

  return {
    score: Math.round(score),
    matchedCount: matchCount
  };
};

/**
 * Calculate experience match
 */
const calculateExperienceMatch = (userExperience, jobRequirements, jobTitle) => {
  if (!userExperience || userExperience.length === 0) {
    return { score: 20 };
  }

  // Calculate total years
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
  const requirementsLower = (jobRequirements + ' ' + jobTitle).toLowerCase();
  
  // Extract required years
  let requiredYears = 0;
  const yearMatches = requirementsLower.match(/(\d+)\+?\s*years?/gi);
  if (yearMatches) {
    const numbers = yearMatches[0].match(/\d+/g);
    if (numbers) requiredYears = parseInt(numbers[0]);
  }

  // Check seniority
  if (requirementsLower.includes('senior') || requirementsLower.includes('lead')) {
    requiredYears = Math.max(requiredYears, 5);
  } else if (requirementsLower.includes('junior') || requirementsLower.includes('entry')) {
    requiredYears = Math.max(requiredYears, 1);
  }

  let score = 50;
  if (requiredYears === 0) {
    score = Math.min(50 + (yearsOfExperience * 10), 100);
  } else {
    const ratio = yearsOfExperience / requiredYears;
    if (ratio >= 1) score = Math.min(80 + (ratio * 10), 100);
    else if (ratio >= 0.7) score = 60 + (ratio * 20);
    else score = 30 + (ratio * 30);
  }

  // Bonus for relevant titles
  const relevantExperience = userExperience.some(exp => {
    const positionLower = (exp.position || '').toLowerCase();
    const titleWords = jobTitle.toLowerCase().split(' ').filter(w => w.length > 3);
    return titleWords.some(word => positionLower.includes(word));
  });

  if (relevantExperience) score = Math.min(score + 15, 100);

  return { score: Math.round(score) };
};

/**
 * Calculate location match
 */
const calculateLocationMatch = (userLocation, jobLocation, jobWorkMode) => {
  if (jobWorkMode && jobWorkMode.toLowerCase().includes('remote')) {
    return { score: 100 };
  }

  if (!userLocation || !jobLocation) {
    return { score: 50 };
  }

  const userLoc = userLocation.toLowerCase().trim();
  const jobLoc = jobLocation.toLowerCase().trim();

  if (userLoc === jobLoc) return { score: 100 };

  const userCity = userLoc.split(',')[0].trim();
  const jobCity = jobLoc.split(',')[0].trim();

  if (userCity === jobCity) return { score: 95 };
  if (userLoc.includes(jobCity) || jobLoc.includes(userCity)) return { score: 70 };

  const userCountry = userLoc.split(',').pop().trim();
  const jobCountry = jobLoc.split(',').pop().trim();

  if (userCountry === jobCountry) return { score: 50 };

  return { score: 30 };
};

/**
 * Calculate job type match
 */
const calculateJobTypeMatch = (userAvailability, jobType) => {
  if (!userAvailability || !jobType) return { score: 70 };

  const availLower = userAvailability.toLowerCase();
  const typeLower = jobType.toLowerCase();

  if (typeLower.includes('remote') || availLower.includes('remote')) {
    return { score: 100 };
  }

  if (availLower.includes('not actively looking')) {
    return { score: 40 };
  }

  if (availLower.includes('available')) {
    if (typeLower.includes('full-time')) return { score: 100 };
    if (typeLower.includes('part-time')) return { score: 85 };
    if (typeLower.includes('contract')) return { score: 80 };
  }

  return { score: 70 };
};

/**
 * Calculate salary match
 */
const calculateSalaryMatch = (expectedSalary, jobSalaryRange) => {
  if (!expectedSalary || !jobSalaryRange) return { score: 70 };

  const extractNumber = (str) => {
    const numbers = str.match(/\d+/g);
    return numbers ? parseInt(numbers[0]) : 0;
  };

  const expected = extractNumber(expectedSalary);
  const jobSalary = extractNumber(jobSalaryRange);

  if (expected === 0 || jobSalary === 0) return { score: 70 };

  const ratio = jobSalary / expected;

  if (ratio >= 1) return { score: 100 };
  if (ratio >= 0.9) return { score: 85 };
  if (ratio >= 0.8) return { score: 70 };
  if (ratio >= 0.7) return { score: 50 };
  return { score: 30 };
};

/**
 * Calculate education match
 */
const calculateEducationMatch = (userEducation, jobRequirements) => {
  if (!userEducation || userEducation.length === 0) return { score: 50 };

  const reqLower = jobRequirements.toLowerCase();
  const degrees = {
    'phd': 100, 'doctorate': 100, 'master': 85,
    'bachelor': 70, 'associate': 60
  };

  let userHighestDegree = 0;
  userEducation.forEach(edu => {
    const degreeLower = (edu.degree || '').toLowerCase();
    Object.keys(degrees).forEach(degreeType => {
      if (degreeLower.includes(degreeType)) {
        userHighestDegree = Math.max(userHighestDegree, degrees[degreeType]);
      }
    });
  });

  let requiredDegree = 0;
  Object.keys(degrees).forEach(degreeType => {
    if (reqLower.includes(degreeType)) {
      requiredDegree = Math.max(requiredDegree, degrees[degreeType]);
    }
  });

  if (requiredDegree === 0) return { score: userHighestDegree || 70 };
  if (userHighestDegree >= requiredDegree) return { score: 100 };
  if (userHighestDegree > 0) return { score: 60 };
  return { score: 40 };
};

module.exports = { calculateJobMatch };