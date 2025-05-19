// 보상 요청 모달 onMount
window.openModalWithEvent = async (event) => {
    const modal = document.getElementById('rewardModal');
    const confirmBtn = document.getElementById('confirmRequestBtn');
    const participateBtn = document.getElementById('participationEventBtn');

    // 이벤트명
    document.getElementById('modal-title').innerText = event.title;
    // 이벤트 설명
    document.getElementById('modal-description').innerText = event.description || '-';
    // 시작-종료일
    document.getElementById('modal-dates').innerText = `${event.startDate} ~ ${event.endDate}`;

    // 조건 변환
    const convertCondition = (cond) => {
        switch (cond) {
            case 'login_count': return '로그인';
            case 'purchase_count': return '출석';
            case 'invite_count': return '친구초대';
            default: return null;
        }
    };

    const defaultText = convertCondition(event.condition);
    let conditionText = '';
    if (defaultText) {
        conditionText = defaultText + (event.custom_condition ? ` (${event.custom_condition})` : '');
    } else {
        conditionText = event.custom_condition || event.condition;
    }
    const valueText = ` ${event.value}회`;
    document.getElementById('modal-condition').innerText = conditionText + valueText;

    // 보상 (rewards 배열로 수정되어 수정함)
    if (Array.isArray(event.rewards) && event.rewards.length > 0) {
        const rewardText = event.rewards.map(reward => `${reward.type} [ ${reward.amount} ]`).join(', ');
        document.getElementById('modal-reward').innerText = rewardText;
    } else {
        document.getElementById('modal-reward').innerText = '없음';
    }

    // 조건 달성도 조회
    try {
        const res = await fetch(`/event/progress?eventId=${event._id}`, {
            credentials: 'include',
        });
        const data = await res.json(); //보상 요청으로인해 return값이 변경됨
        const progress = data.userProgress ?? 0;
        document.getElementById('modal-progress').innerText = progress;
        // 조건 만족 여부에 따라 보상요청 버튼 활성화
        if (progress >= event.value) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('disabled');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('disabled');
        }
    } catch (e) {
        document.getElementById('modal-progress').innerText = '조회 실패';
        confirmBtn.disabled = true;
    }

    // 버튼에 이벤트 정보 저장
    confirmBtn.dataset.eventId = event._id;
    participateBtn.dataset.eventId = event._id;
    participateBtn.dataset.value = event.value; //value도 저장 (string)

    modal.classList.remove('hidden');
};

// 모달 관련 DOM 이벤트 등록
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('rewardModal');
    const closeBtn = document.querySelector('.reward-close-btn');
    const confirmBtn = document.getElementById('confirmRequestBtn');
    const participateBtn = document.getElementById('participationEventBtn');

    // 모달 닫기 버튼
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // 보상 요청 버튼
    confirmBtn.addEventListener('click', async () => {
        const eventId = confirmBtn.dataset.eventId;
        try {
            const res = await fetch(`/event/request-reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ eventId })
            });
            const result = await res.json();
            alert(result.message || '요청 완료');
            location.reload(); // 상태 갱신용
        } catch (err) {
            alert('요청 실패');
        }
    });

    // 이벤트 참여 버튼
    participateBtn.addEventListener('click', async () => {
        const eventId = participateBtn.dataset.eventId;
        const required = parseInt(participateBtn.dataset.value); //저장된 value 사용

        try {
            const res = await fetch(`/event/userParticipate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ eventId })
            });

            const result = await res.json();
            if (res.ok) {
                alert(result.message || '이벤트에 참여했습니다. [보상 요청을 위해 중복으로 계속 참여 가능]');
                // 다시 조건 달성도 조회
                const progressRes = await fetch(`/event/progress?eventId=${eventId}`, {
                    credentials: 'include',
                });
                
                const progressData = await progressRes.json();
                const progress = progressData.userProgress ?? 0;
                document.getElementById('modal-progress').innerText = progress;

                // 조건 충족 여부 판단해서 버튼 상태 업데이트
                if (progress >= required) {
                    confirmBtn.disabled = false;
                    confirmBtn.classList.remove('disabled');
                } else {
                    confirmBtn.disabled = true;
                    confirmBtn.classList.add('disabled');
                }
            } else {
                alert(result.message || '참여 실패');
            }
        } catch (err) {
            alert('참여 중 오류 발생');
        }
    });
});
