let eventList = []; // 이벤트 목록 전역 변수
let currentPage = 1;
const rowsPerPage = 5;

//onMount
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. 이벤트 목록 불러오기
        const eventsRes = await fetch('/event/getEvents');
        const rawEventList = await eventsRes.json();

        // 2. 각 이벤트별 보상 상태 조회 병렬 처리
        eventList = await Promise.all(
            rawEventList.map(async (event) => {
                try {
                    const statusRes = await fetch(`/event/reward-status?eventId=${event._id}`);
                    const { status } = await statusRes.json();

                    let rewardStatus = '미지급';
                    if (status === 'given') {
                        rewardStatus = '지급됨'
                    } else if (status === 'requested') {
                        rewardStatus = '요청됨 (승인 대기)'
                    } else if (status === 'rejected') {
                        rewardStatus = '거절됨 (재요청 필요)'
                    } else if (status === 'approved'){
                        rewardStatus = '요청 승인[보상 지급 예정]' //승인 후 바로 지급까지 이어지는 프로세스지만 혹시 중간에 에러가 발생하는경우를위해 분기점을 추가해둠
                    }

                    return { ...event, rewardStatus };
                } catch (err) {
                    console.error(`이벤트 ${event.title} 상태 조회 실패`, err);
                    return { ...event, rewardStatus: '상태 조회 실패' };
                }
            })
        );

        // 테이블 초기 렌더링
        initPaginationAndRender();

    } catch (err) {
        console.error('이벤트 목록 조회 실패', err);
        document.getElementById('eventTableBody').innerHTML =
            `<tr><td colspan="5">이벤트 불러오기 실패</td></tr>`;
    }
});

// 테이블 초기 렌더링 function모음
function initPaginationAndRender() {
    renderTablePage(currentPage);
    renderPagination();
}

// 테이블 렌더링
function renderTablePage(page) {
    const tableBody = document.getElementById('eventTableBody');
    tableBody.innerHTML = '';
    const start = (page - 1) * rowsPerPage;
    const paginatedItems = eventList.slice(start, start + rowsPerPage);

    if (paginatedItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">등록된 이벤트가 없습니다.</td></tr>`;
        return;
    }

    paginatedItems.forEach(event => {
        const tr = document.createElement('tr');

        //보상이 배열로 변경되어 먼저 convert해줌
        const rewardCell = Array.isArray(event.rewards)
            ? event.rewards.map(r => `${r.type} (${r.amount})`).join(', ')
            : ''; // 보상이 없으면 빈 문자열

        tr.innerHTML = `
          <td>${event.title}</td>
          <td>${event.description}</td>
          <td>${event.startDate} ~ ${event.endDate}</td>
          <td>${rewardCell}</td>
          <td class="reward-status-cell">
            ${renderStatusCell(event)}
          </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 상태 convert
function renderStatusCell(event) {
    if (event.rewardStatus === '지급됨') {
        return `<span class="status success">지급됨</span>`;
    } else if (event.rewardStatus === '요청됨 (승인 대기)') {
        return `<span class="status pending">요청됨 (승인 대기)</span>`;
    } else if (event.rewardStatus === '이벤트 기간이 아닙니다') {
        return `<span class="status disabled">이벤트 기간이 아닙니다</span>`;
    } else if( event.rewardStatus === '요청 승인[보상 지급 예정]'){
        return `<span class="status success"> 보상 지급 예정 </span>`;
    } else if (event.rewardStatus === '거절됨 (재요청 필요)') {
        return  `
        <span class="status rejected">거절됨</span>
        <button class="request-btn" data-event='${JSON.stringify(event)}'>
          재요청
        </button>
      `;
    } else {
        return `
      <span class="status none">미지급</span>
      <button class="request-btn" data-event='${JSON.stringify(event)}'>
        달성 확인 및 요청
      </button>
    `;
    }
}

// 페이지네이션
function renderPagination() {
    const container = document.getElementById('paginationContainer');
    container.innerHTML = '';

    const pageCount = Math.ceil(eventList.length / rowsPerPage);

    //  이전 버튼
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀';
    prevBtn.classList.add('pagination-btn');
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTablePage(currentPage);
            renderPagination();
        }
    });
    container.appendChild(prevBtn);

    // 숫자 버튼
    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.classList.add('pagination-btn');
        if (i === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => {
            currentPage = i;
            renderTablePage(currentPage);
            renderPagination();
        });
        container.appendChild(btn);
    }

    //  다음 버튼
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '▶';
    nextBtn.classList.add('pagination-btn');
    nextBtn.disabled = currentPage === pageCount;
    nextBtn.addEventListener('click', () => {
        if (currentPage < pageCount) {
            currentPage++;
            renderTablePage(currentPage);
            renderPagination();
        }
    });
    container.appendChild(nextBtn);
}
// 보상 요청 모달 버튼 연동
document.getElementById('eventTableBody').addEventListener('click', (e) => {
    if (e.target.classList.contains('request-btn')) {
        const eventData = JSON.parse(e.target.dataset.event);
        openModalWithEvent(eventData); // rewardModal.js에서 정의되어 있어야 함
    }
});
