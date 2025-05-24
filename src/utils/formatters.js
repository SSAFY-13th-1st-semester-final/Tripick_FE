/**
 * 숫자를 통화 형식으로 변환
 * @param {number} amount - 변환할 금액
 * @param {string} locale - 로캘 (기본값: ko-KR)
 * @param {string} currency - 통화 (기본값: KRW)
 * @returns {string} - 통화 형식으로 변환된 문자열
 */
export const formatCurrency = (amount, locale = 'ko-KR', currency = 'KRW') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * 숫자에 천 단위 구분자 추가
 * @param {number} number - 변환할 숫자
 * @param {string} locale - 로캘 (기본값: ko-KR)
 * @returns {string} - 천 단위 구분자가 추가된 문자열
 */
export const formatNumber = (number, locale = 'ko-KR') => {
  return new Intl.NumberFormat(locale).format(number)
}

/**
 * 날짜를 포맷팅된 문자열로 변환
 * @param {Date|string} date - 변환할 날짜
 * @param {Object} options - 날짜 포맷 옵션
 * @param {string} locale - 로캘 (기본값: ko-KR)
 * @returns {string} - 포맷팅된 날짜 문자열
 */
export const formatDate = (date, options = {}, locale = 'ko-KR') => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  const mergedOptions = { ...defaultOptions, ...options }
  
  return new Date(date).toLocaleDateString(locale, mergedOptions)
}

/**
 * 날짜를 상대적 시간으로 변환 (예: "3일 전", "방금 전")
 * @param {Date|string} date - 변환할 날짜
 * @param {string} locale - 로캘 (기본값: ko-KR)
 * @returns {string} - 상대적 시간 문자열
 */
export const formatRelativeTime = (date, locale = 'ko-KR') => {
  const now = new Date()
  const past = new Date(date)
  const diffInMilliseconds = now - past
  
  // 초 단위 차이
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000)
  
  // 분 단위 차이
  if (diffInSeconds < 60) {
    return diffInSeconds < 5 ? '방금 전' : `${diffInSeconds}초 전`
  }
  
  // 분 단위 차이
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }
  
  // 시간 단위 차이
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }
  
  // 일 단위 차이
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}일 전`
  }
  
  // 월 단위 차이
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`
  }
  
  // 년 단위 차이
  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}년 전`
}

/**
 * 전화번호 포맷팅 (예: 010-1234-5678)
 * @param {string} phoneNumber - 변환할 전화번호
 * @returns {string} - 포맷팅된 전화번호
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return ''
  
  // 숫자만 추출
  const numbers = phoneNumber.replace(/\D/g, '')
  
  // 숫자 길이에 따라 포맷팅
  if (numbers.length === 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
  } else if (numbers.length === 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  }
  
  // 그 외의 경우 원본 반환
  return phoneNumber
}

/**
 * 문자열 길이 제한 및 말줄임표 추가
 * @param {string} text - 원본 문자열
 * @param {number} maxLength - 최대 길이
 * @returns {string} - 제한된 문자열
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  
  return text.slice(0, maxLength) + '...'
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환 (예: 1.5 MB)
 * @param {number} bytes - 바이트 단위 파일 크기
 * @param {number} decimals - 소수점 자릿수 (기본값: 2)
 * @returns {string} - 포맷팅된 파일 크기
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 한국 날짜로 변환합니다.
 * 
 */
export const toKSTDateString = (date) => {
  // 문자열인 경우 Date 객체로 변환
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return null;
  }

  return new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
