function getCSRFToken() {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function resetProgress() {
  if (!confirm("本当に進行状況をリセットしますか？\nクリア済みの問題がすべてリセットされます。")) {
    return;
  }
  
  fetch("/reset_progress/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": getCSRFToken(),
    },
    body: "confirm=true"
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === 'success') {
        alert(result.message);
        location.href = "/game/";
      }
    })
    .catch(error => console.error(error));
}

function deleteAccount() {
  if (!confirm("本当にアカウントを削除しますか？\nこの操作は取り消せません。")) {
    return;
  }
  
  if (!confirm("最終確認：本当にアカウントを削除しますか？")) {
    return;
  }
  
  fetch("/delete_account/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRFToken": getCSRFToken(),
    },
    body: "confirm=true"
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === 'success') {
        alert(result.message);
        location.href = "/";
      }
    })
    .catch(error => console.error(error));
}