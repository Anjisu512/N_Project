let allEvents = [];         // 전체 이벤트 목록
let filteredEvents = [];    // 필터링된 이벤트 목록
let currentPage = 1;        // 현재 페이지
const pageSize = 5;         // 한 페이지당 보여줄 이벤트 수
let selectedEventForDelete = null;  // 삭제 대상 이벤트 저장


// 모달 열기
function openEventModal() {
  document.getElementById('eventModal').style.display = 'flex';
};

// 모달 닫기
function closeEventModal() {
  document.getElementById('eventModal').style.display = 'none';

  //이벤트 등록/ 등록하지않고 modal닫을때 남아있던 기록들 reset
  // 폼 초기화
  document.getElementById('eventForm').reset();
  // 직접 입력 조건 필드도 숨기기
  document.getElementById('customCondition').style.display = 'none';
}

// 필터 조건: 현재 진행 중인 이벤트인지 확인해주는 function
function isOngoing(event) {
  const today = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  return start <= today && today <= end;
}

// 필터 및 렌더링 적용
function applyFiltersAndRender() {
  const onlyActive = document.getElementById('filterActiveOnly')?.checked;
  filteredEvents = allEvents.filter(ev => !onlyActive || isOngoing(ev));
  currentPage = 1;
  renderEventList(); //필터적용이 끝났따면 render
}

// 페이지 기반 렌더링
function renderEventList() {
  const container = document.getElementById('eventListContainer');
  container.innerHTML = '';

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageEvents = filteredEvents.slice(start, end);

  if (pageEvents.length === 0) {
    container.innerHTML = '<li>이벤트가 없습니다.</li>';
  } else {
    pageEvents.forEach(evt => {
      const span = document.createElement('span');
      span.classList.add('event-item');
      span.innerText = `● ${evt.title} (${evt.startDate} ~ ${evt.endDate})`;
      span.onclick = () => openDetailModal(evt);
      container.appendChild(span);
    });

  }

  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  const pageIndicator = document.getElementById('pageIndicator');
  if (pageIndicator) {
    pageIndicator.textContent = `${currentPage} / ${totalPages || 1}`;
  }
}

// 페이지 이동
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderEventList();
  }
}
function nextPage() {
  const totalPages = Math.ceil(filteredEvents.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderEventList();
  }
}

// 진행 중 이벤트 목록 모달 열기
async function openEventListModal() {
  const modal = document.getElementById('eventListModal');
  const container = document.getElementById('eventListContainer');
  modal.style.display = 'flex';
  container.innerHTML = '<li>불러오는 중...</li>';

  try {
    const res = await fetch('/event/getEvents');
    const events = await res.json();

    allEvents = events || [];
    applyFiltersAndRender(); //전체보기가 아닌 진행중 이벤트만 보기를 선택한경우를 고려하여 추가됨
  } catch (err) {
    console.error('이벤트 조회 실패:', err);
    container.innerHTML = '<li>조회 실패</li>';
  }
}

// 모달 닫기
function closeEventListModal() {
  document.getElementById('eventListModal').style.display = 'none';
}

function openDetailModal(event) {
  selectedEventForDelete = event; // 삭제기능을위한 event설정

  document.getElementById('detailTitle').innerText = event.title;
  document.getElementById('detailDescription').innerText = event.description || '설명 없음';
  document.getElementById('detailPeriod').innerText = `${event.startDate} ~ ${event.endDate}`;

  //보상을 추후 등록하므로 상세보기에서 그대로받아오면 오류발생하여 추가된 소스
  //보상이 array로 변경됨에따라 joinner사용(',')하여 렌더링되도록함
  const rewardEl = document.getElementById('detailReward');
  if (Array.isArray(event.rewards) && event.rewards.length > 0) {
    const rewardText = event.rewards.map(reward => `${reward.type.toUpperCase()} [${reward.amount}]`).join(', ');
    rewardEl.innerText = rewardText;
  } else {
    rewardEl.innerText = '보상 미등록';
  }

  document.getElementById('eventDetailModal').style.display = 'flex';

  const statusEl = document.getElementById('rewardStatus');
  statusEl.innerText = '보상 상태: 확인 중...';
  statusEl.className = 'eventDetail-value eventDetail-status'; // 초기화

  fetch(`/event/reward-status?eventId=${event._id || event.id}`)
    .then(res => res.json())
    .then(result => {
      if (result?.status === 'given') {
        statusEl.innerText = '지급됨';
        statusEl.className += ' success';
      } else if (result?.status === 'requested') {
        statusEl.innerText = '요청됨 (승인 대기)';
        statusEl.className += ' pending';
      } else {
        statusEl.innerText = '미지급';
        statusEl.className += ' none';
      }
    })
    .catch(() => {
      statusEl.innerText = '보상 상태 없음';
      statusEl.className += ' none';
    });
}

function closeEventDetailModal() {
  document.getElementById('eventDetailModal').style.display = 'none';
}


//onMount
document.addEventListener('DOMContentLoaded', () => {
  // 오늘 이후만 선택 가능하도록 설정
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;

  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  if (startDateInput) startDateInput.min = minDate;
  if (endDateInput) endDateInput.min = minDate;

  if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', () => {
      endDateInput.min = startDateInput.value;
      if (endDateInput.value < startDateInput.value) {
        endDateInput.value = '';
      }
    });
  }

  // 이벤트 등록 form 처리
  const form = document.getElementById('eventForm');
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      if ('value' in data) {
        data.value = Number(data.value)
      };

      try {
        const response = await fetch('/event/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          alert('이벤트가 등록되었습니다!');
          closeEventModal();
        } else {
          const result = await response.json();
          alert(result.message || '등록 실패');
        }
      } catch (err) {
        alert('서버 오류');
        console.error(err);
      };
    });
  };

  // 조건 드롭다운 제어
  const conditionSelect = document.getElementById('conditionSelect');
  const customConditionInput = document.getElementById('customCondition');

  if (conditionSelect && customConditionInput) {
    conditionSelect.addEventListener('change', function () {
      if (this.value === 'custom') {
        customConditionInput.style.display = 'inline-block';
        customConditionInput.setAttribute('required', 'required');
      } else {
        customConditionInput.style.display = 'none';
        customConditionInput.removeAttribute('required');
      }
    });
  }


  //이벤트 삭제 버튼 핸들러 추가
  const deleteBtn = document.getElementById('deleteEventBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!selectedEventForDelete) {
        alert('삭제할 이벤트가 선택되지 않았습니다.');
        return;
      }

      //경고문 1회발송
      const confirmed = confirm(`정말로 "${selectedEventForDelete.title}" 이벤트를 삭제하시겠습니까?`);
      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(`/event/delete/${selectedEventForDelete._id || selectedEventForDelete.id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          alert('이벤트가 삭제되었습니다.');
          closeEventDetailModal();
          await openEventListModal(); // 목록 갱신
        } else {
          const result = await response.json();
          alert(result.message || '삭제 실패');
        }
      } catch (err) {
        alert('서버 오류로 삭제 실패');
        console.error(err);
      }
    });
  };

  //  보상 요청 거절 알림 처리
  const rejectedNoticeRaw = document.getElementById('rejectedNotice-data');
  let rejectedNotice = [];
  if (rejectedNoticeRaw) {
    try {
      rejectedNotice = JSON.parse(rejectedNoticeRaw.textContent.trim());
    } catch (err) {
      console.warn('rejectedNotice 파싱 오류:', err);
    }
  }

  // 거절된 보상 알림 표시 및 처리
  if (Array.isArray(rejectedNotice) && rejectedNotice.length > 0) {
    //보상거절이 다중인경우 joinner로 진행
    const msg = rejectedNotice.map(r => `- ${r.eventTitle} (거절일: ${new Date(r.rejectedAt).toLocaleString()})`).join('\n');

    alert('(!) 보상 요청이 거절된 이벤트가 있습니다:\n\n' + msg);

    //확인 후 해당 eventId의 속성중 isCheck를 true로 변경하는 로직을 실행하여 2번 같은 알림이 안나오도록 설정
    const eventIds = rejectedNotice.map(r => r.eventId);
    fetch('/event/rejected-reward/check', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds }),
      credentials: 'include'
    }).catch(err => {
      console.warn('보상 거절 확인 상태 업데이트 실패:', err);
    });
  };
});