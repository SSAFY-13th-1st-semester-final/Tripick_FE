import AuthService from "@/services/auth.service";

/**
 * 중복 아이디(또는 이메일) 검사
 * @param {string} username - 검사할 아이디 또는 이메일
 * @returns {Promise<boolean>} - 사용 가능한 경우 true, 중복된 경우 false
 */
export const isUsernameAvailable = async (username) => {
  if (!username) return false;

  try {
    const response = await AuthService.checkUsername(username);
    return response.status === 200;
  } catch (error) {
    if (error.response?.status === 409) {
      return false;
    }
    // 다른 에러(예: 네트워크 오류)는 콘솔에 출력하고 false 반환
    return false;
  }
};

/**
 * 이메일 유효성 검사
 * @param {string} email - 검사할 이메일
 * @returns {boolean} - 유효한 이메일인지 여부
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 유효성 검사 - 영문과 숫자 조합으로 8자리 이상
 * @param {string} password - 검사할 비밀번호
 * @returns {boolean} - 유효한 비밀번호인지 여부
 */
export const isValidPassword = (password) => {
  // 영문과 숫자 조합 8자리 이상
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * 전화번호 유효성 검사
 * @param {string} phoneNumber - 검사할 전화번호
 * @returns {boolean} - 유효한 전화번호인지 여부
 */
export const isValidPhoneNumber = (phoneNumber) => {
  // 000-0000-0000 또는 000-000-0000 형식
  const phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
  return phoneRegex.test(phoneNumber);
};

/**
 * 필수 입력값 확인
 * @param {string} value - 검사할 값
 * @returns {boolean} - 값이 있는지 여부
 */
export const isRequired = (value) => {
  return !!value && value.trim() !== "";
};

/**
 * 최소 길이 확인
 * @param {string} value - 검사할 값
 * @param {number} min - 최소 길이
 * @returns {boolean} - 최소 길이를 충족하는지 여부
 */
export const hasMinLength = (value, min) => {
  return value && value.length >= min;
};

/**
 * 최대 길이 확인
 * @param {string} value - 검사할 값
 * @param {number} max - 최대 길이
 * @returns {boolean} - 최대 길이를 충족하는지 여부
 */
export const hasMaxLength = (value, max) => {
  return value && value.length <= max;
};

/**
 * 두 값이 일치하는지 확인 (비밀번호 확인 등)
 * @param {any} value1 - 첫 번째 값
 * @param {any} value2 - 두 번째 값
 * @returns {boolean} - 두 값이 일치하는지 여부
 */
export const isMatching = (value1, value2) => {
  return value1 === value2;
};

/**
 * URL 유효성 검사
 * @param {string} url - 검사할 URL
 * @returns {boolean} - 유효한 URL인지 여부
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * 숫자만 포함하는지 확인
 * @param {string} value - 검사할 값
 * @returns {boolean} - 숫자만 포함하는지 여부
 */
export const isNumeric = (value) => {
  return /^\d+$/.test(value);
};

/**
 * 영문자만 포함하는지 확인
 * @param {string} value - 검사할 값
 * @returns {boolean} - 영문자만 포함하는지 여부
 */
export const isAlpha = (value) => {
  return /^[A-Za-z]+$/.test(value);
};

/**
 * 한글만 포함하는지 확인
 * @param {string} value - 검사할 값
 * @returns {boolean} - 한글만 포함하는지 여부
 */
export const isKorean = (value) => {
  return /^[가-힣]+$/.test(value);
};

/**
 * 영문자와 숫자만 포함하는지 확인
 * @param {string} value - 검사할 값
 * @returns {boolean} - 영문자와 숫자만 포함하는지 여부
 */
export const isAlphaNumeric = (value) => {
  return /^[A-Za-z0-9]+$/.test(value);
};
