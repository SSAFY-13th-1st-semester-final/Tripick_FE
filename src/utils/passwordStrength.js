/**
 * 비밀번호 강도 측정 유틸리티
 * 비밀번호 강도를 계산하고 관련 정보를 반환하는 함수들을 제공합니다.
 */

/**
 * 비밀번호 강도 점수(0-100) 계산
 * @param {string} password - 검사할 비밀번호
 * @returns {number} 0-100 사이의 강도 점수
 */
export const calculatePasswordStrength = (password) => {
  if (!password) return 0;

  let strength = 0;

  // 길이 점수 (최대 40%)
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 20;

  // 문자 다양성 점수 (각 20%)
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/\d/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;

  return Math.min(100, strength);
};

/**
 * 비밀번호 강도 클래스 반환
 * @param {number} strength - 비밀번호 강도 점수 (0-100)
 * @returns {string} 강도 클래스 ('weak', 'medium', 'strong')
 */
export const getPasswordStrengthClass = (strength) => {
  if (strength < 40) return "weak";
  if (strength < 70) return "medium";
  return "strong";
};

/**
 * 비밀번호 강도 텍스트 반환
 * @param {number} strength - 비밀번호 강도 점수 (0-100)
 * @returns {string} 강도 텍스트 ('약함', '보통', '강함')
 */
export const getPasswordStrengthText = (strength) => {
  if (strength < 40) return "약함";
  if (strength < 70) return "보통";
  return "강함";
};

/**
 * 비밀번호 강도 분석 정보 반환
 * @param {string} password - 분석할 비밀번호
 * @returns {Object} 강도 정보 객체 { strength, strengthClass, strengthText }
 */
export const analyzePasswordStrength = (password) => {
  const strength = calculatePasswordStrength(password);

  return {
    strength,
    strengthClass: getPasswordStrengthClass(strength),
    strengthText: getPasswordStrengthText(strength),
  };
};
