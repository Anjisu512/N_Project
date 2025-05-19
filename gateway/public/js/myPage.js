import { formatKoreanDateTime } from './utils/dateFormatter.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const userDataTag = document.getElementById('userInfo-data');
    if (!userDataTag) {
      throw new Error('userInfo-data 스크립트 태그가 없습니다')
    };

    const { userId } = JSON.parse(userDataTag.textContent);
    const res = await fetch(`/auth/getUserInfo/${userId}`);
    const user = await res.json();

    //유저 가입일
    const createdAt = formatKoreanDateTime(user.userData.createdAt);
    document.getElementById('createdAt').textContent = createdAt;

    /**필요한 정보는 이미 페이지가 로드될때 가져오고있기 때문에 DomContent내부에 보상이력 확인 Modal기능을 설계 */

    // 모달 버튼 이벤트
    const openBtn = document.getElementById('openRewardBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('rewardModal');
    const rewardList = document.getElementById('rewardHistoryList');

    openBtn.addEventListener('click', () => {
      rewardList.innerHTML = '';

      if (user.userData.rewardHistories.length === 0) {
        rewardList.innerHTML = '<p>보상 이력이 없습니다.</p>';
      } else {
        user.userData.rewardHistories.forEach(history => {
          const div = document.createElement('div');
          const rewardText = history.rewards.map(r => `${r.type} (${r.amount})`).join(', '); //보상내역을 [보상:수량] 으로 합침
          div.classList.add('myPage-reward-row');
          //이벤트 보상이력이 다중일경우 가독성을위해 1줄로 나오게 작성
          div.innerHTML = `
                          • <strong>[이벤트명: ${history.eventTitle}]</strong>
                          • 보상: ${rewardText}
                          • 요청일: ${formatKoreanDateTime(history.requestedAt)}
                          • 승인일: ${formatKoreanDateTime(history.approvedAt)}
                          `.replace(/\s+/g, ' ').trim(); // 줄바꿈/공백 제거로 1줄 정리

          rewardList.appendChild(div);
        });
      }

      modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });


  } catch (err) {
    console.error('유저 정보 처리 오류:', err);
    document.getElementById('userInfoCard').innerHTML =
      '<p>유저 정보를 불러오는 데 실패했습니다.</p>';
  }
});
