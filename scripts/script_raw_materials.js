// Универсальные функции
const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];

// Открытие модального окна
const openModal = (content) => {
  const modal = document.getElementById("modal");
  const editForm = document.getElementById("edit-form");
  editForm.innerHTML = content;
  modal.style.display = "block";
};

// Закрытие модального окна
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("modal").style.display = "none";
});

// Логика для страницы "Сырьё"
if (window.location.pathname.includes("raw_materials.html")) {
  const form = document.getElementById("add-raw-material-form");
  const tableBody = document.querySelector("#raw-materials-table tbody");

  // Функция для форматирования названия (первая буква заглавная)
  const formatName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Функция для сортировки сырья по алфавиту
  const sortRawMaterials = (materials) => {
    return materials.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Загрузка данных при открытии страницы
  const loadRawMaterials = () => {
    const rawMaterials = sortRawMaterials(getData("rawMaterials")); // Сортируем данные
    tableBody.innerHTML = rawMaterials
      .map(
        (material, index) => `
        <tr>
          <td><input type="checkbox" class="select-checkbox" data-index="${index}"></td>
          <td>${material.name}</td>
          <td>${material.unit}</td>
          <td>${material.price.toFixed(2)}</td>
          <td>
            <button onclick="editRawMaterial(${index})" class="edit-btn">Редактировать</button>
            <button onclick="deleteRawMaterial(${index})" class="delete-btn">Удалить</button>
          </td>
        </tr>
      `
      )
      .join("");
  };

  // Добавление сырья
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = formatName(document.getElementById("raw-material-name").value.trim()); // Форматируем название
    const unit = document.getElementById("raw-material-unit").value;
    const price = parseFloat(document.getElementById("raw-material-price").value);

    // Валидация
    if (!name || !unit || isNaN(price) || price <= 0) {
      alert("Пожалуйста, заполните все поля корректно. Цена должна быть положительной.");
      return;
    }

    const rawMaterials = getData("rawMaterials");
    rawMaterials.push({ name, unit, price });
    saveData("rawMaterials", rawMaterials);
    loadRawMaterials();
    form.reset();
  });

  // Редактирование сырья
  window.editRawMaterial = (index) => {
    const rawMaterials = getData("rawMaterials");
    const material = rawMaterials[index];
    const content = `
      <input type="text" id="edit-name" value="${material.name}" required>
      <select id="edit-unit" required>
        <option value="кг" ${material.unit === "кг" ? "selected" : ""}>кг</option>
        <option value="л" ${material.unit === "л" ? "selected" : ""}>л</option>
        <option value="шт" ${material.unit === "шт" ? "selected" : ""}>шт</option>
      </select>
      <input type="number" id="edit-price" value="${material.price.toFixed(2)}" step="0.01" required>
      <button type="submit" class="btn">Сохранить</button>
    `;
    openModal(content);

    document.getElementById("edit-form").onsubmit = (e) => {
      e.preventDefault();
      material.name = formatName(document.getElementById("edit-name").value.trim()); // Форматируем название
      material.unit = document.getElementById("edit-unit").value;
      material.price = parseFloat(document.getElementById("edit-price").value);

      if (!material.name || !material.unit || isNaN(material.price) || material.price <= 0) {
        alert("Пожалуйста, заполните все поля корректно. Цена должна быть положительной.");
        return;
      }

      saveData("rawMaterials", rawMaterials);
      loadRawMaterials();
      document.getElementById("modal").style.display = "none";
    };
  };

  // Удаление сырья
  window.deleteRawMaterial = (index) => {
    const rawMaterials = getData("rawMaterials");
    if (confirm("Вы уверены, что хотите удалить этот элемент?")) {
      rawMaterials.splice(index, 1);
      saveData("rawMaterials", rawMaterials);
      loadRawMaterials();
    }
  };

  // Выделить все чекбоксы при нажатии на чекбокс в шапке
  document.getElementById("select-all-checkbox").addEventListener("click", (e) => {
    const checkboxes = document.querySelectorAll(".select-checkbox");
    checkboxes.forEach((checkbox) => (checkbox.checked = e.target.checked));
  });

  // Удалить выбранные элементы
  document.getElementById("delete-selected").addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".select-checkbox:checked");
    const rawMaterials = getData("rawMaterials");

    if (checkboxes.length === 0) {
      alert("Выберите элементы для удаления.");
      return;
    }

    if (confirm("Вы уверены, что хотите удалить выбранные элементы?")) {
      const indicesToDelete = Array.from(checkboxes).map((checkbox) =>
        parseInt(checkbox.getAttribute("data-index"))
      );

      indicesToDelete
        .sort((a, b) => b - a)
        .forEach((index) => rawMaterials.splice(index, 1));

      saveData("rawMaterials", rawMaterials);
      loadRawMaterials();
    }
  });

  // Экспорт выбранных элементов в Excel
  document.getElementById("export-selected").addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".select-checkbox:checked");
    const rawMaterials = getData("rawMaterials");

    if (checkboxes.length === 0) {
      alert("Выберите элементы для экспорта.");
      return;
    }

    const selectedMaterials = Array.from(checkboxes).map((checkbox) =>
      rawMaterials[parseInt(checkbox.getAttribute("data-index"))]
    );

    // Создаем массив данных для Excel
    const data = selectedMaterials.map((material) => [material.name, material.unit, material.price]);

    // Создаем новый рабочий лист
    const ws = XLSX.utils.aoa_to_sheet([["Название", "Единица измерения", "Цена (KGS)"], ...data]);

    // Создаем новую книгу и добавляем рабочий лист
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Сырьё");

    // Сохраняем файл
    XLSX.writeFile(wb, "selected_raw_materials.xlsx");
  });

  // Загрузка данных при открытии страницы
  loadRawMaterials();
}