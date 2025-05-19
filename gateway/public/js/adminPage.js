const allRoles = ['USER', 'OPERATOR', 'AUDITOR', 'ADMIN'];

let currentUsers = [];
let selectedUser = null;
let selectedRoles = [];

// 유저 관리 모달 열기
document.getElementById("openUserManagerBtn").addEventListener("click", async () => {
    document.getElementById("userMgrModal").classList.remove("hidden");

    try {
        const response = await fetch("/auth/users");
        const users = await response.json();
        renderUserTable(users);
    } catch (error) {
        console.error("유저 정보를 불러오는 데 실패했습니다:", error);
        alert("유저 정보를 불러오는 데 실패했습니다.");
    }
});

// 모달 닫기
document.getElementById("closeUserMgrModal").addEventListener("click", () => {
    document.getElementById("userMgrModal").classList.add("hidden");
});
document.getElementById("closeRoleEditModal").addEventListener("click", () => {
    document.getElementById("roleEditModal").classList.add("hidden");
});
document.getElementById("cancelRoleChangeBtn").addEventListener("click", () => {
    document.getElementById("roleEditModal").classList.add("hidden");
});

// [권한 수정 모달] 저장 버튼 클릭
document.getElementById("saveRoleChangeBtn").addEventListener("click", async () => {
    if (!selectedUser) {
        return;
    };
    //선택된 Role의 Value만 꺼냄
    const checkedRoles = [...document.querySelectorAll("#roleCheckboxList input:checked")].map(el => el.value);
    try {
        const response = await fetch("/auth/updateUserRole", {
            method: "PATCH",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify({ userId: selectedUser._id, roles: checkedRoles })
        });
        // const result = await response.json();
        if (response.ok) {
            alert(`"${selectedUser.username}"의 권한을 다음과 같이 설정완료했습니다.:\n${checkedRoles.join(', ')}`);
            document.getElementById("roleEditModal").classList.add("hidden"); //권한 수정 Modal닫기

            //최신 유저 목록 재요청
            const response = await fetch("/auth/users");
            const users = await response.json();
            renderUserTable(users);
        }
    } catch (error) {
        console.error("유저 정보를 불러오는 데 실패했습니다:", error);
        alert("유저 정보를 불러오는 데 실패했습니다.");
    };
});

// 유저 테이블 렌더링
function renderUserTable(users) {
    currentUsers = users;
    const tbody = document.getElementById("userTableBody");
    tbody.innerHTML = "";

    users.forEach(user => {
        const row = document.createElement("tr");
        const createdDate = new Date(user.createdAt).toLocaleDateString();

        row.innerHTML = `
      <td>${user._id}</td>
      <td>${user.username}</td>
      <td>${createdDate}</td>
      <td>${user.roles}</td>
    `;

        // 권한 수정 버튼 생성 및 바인딩, innerHTML에 동시에 Button을 입력하면 하나하나 찾아서 바인딩해줘야함,
        // 클릭이벤트 누락의 문제가 생겨서 내부에서 바인딩을한다음 append진행
        const roleCell = row.querySelector("td:last-child"); //위에서 마지막으로 진행된 innerHtml의 td => userRole cell, 다른 td가 추가되면 해당부분도 수정해줘야함    
        const roleBtn = document.createElement("button");
        roleBtn.className = "adminPage-role-btn";
        roleBtn.textContent = "권한 수정";
        roleBtn.addEventListener("click", () => openRoleEditModal(user));

        roleCell.appendChild(roleBtn);
        tbody.appendChild(row);
    });
}

// 권한 수정 모달 열기
function openRoleEditModal(user) {
    selectedUser = user;
    selectedRoles = user.roles;

    const container = document.getElementById("roleCheckboxList");
    container.innerHTML = "";

    allRoles.forEach(role => {
        const li = document.createElement("li");
        const isChecked = selectedRoles.includes(role);

        li.innerHTML = `
      <label>
        <input type="checkbox" value="${role}" ${isChecked ? "checked" : ""}>
        ${role}
      </label>
    `;
        container.appendChild(li);
    });

    document.getElementById("roleEditModal").classList.remove("hidden");
}
