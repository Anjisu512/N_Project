//보상일과 요청일, 가입일 등 시분초가 필요한 date를 yyyy-MM-dd HH:mm:ss 형태로 사용하기위한 formatter
export function formatKoreanDateTime(isoString) {
    if (!isoString) {
      return '-'
    };
  
    const date = new Date(isoString);
    const options = {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
  
    // '2025. 05. 19. 14:22:14' 처럼 .을 제거 → '2025-05-19 14:22:14'
    return date.toLocaleString('ko-KR', options).replace(/\. /g, '-').replace('.', '');
  }
  