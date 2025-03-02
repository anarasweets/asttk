// Универсальные функции для работы с API

// Функция для получения данных с сервера
const fetchData = async (url) => {
  const response = await fetch(url);
  return response.json();
};

// Функция для отправки данных на сервер
const postData = async (url, data) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Функция для удаления данных на сервере
const deleteData = async (url) => {
  const response = await fetch(url, {
    method: 'DELETE',
  });
  return response.json();
};

// Открытие модального окна
const openModal = (content) => {
  const modal = document.getElementById('modal');
  const editForm = document.getElementById('edit-form');
  editForm.innerHTML = content;
  modal.style.display = 'block';
};

// Закрытие модального окна
document.querySelector('.close').addEventListener('click', () => {
  document.getElementById('modal').style.display = 'none';
});

// Логика для страницы "Сырьё"
if (window.location.pathname.includes('raw_materials.html')) {
  const form = document.getElementById('add-raw-material-form');
  const tableBody = document.querySelector('#raw-materials-table tbody');

  // Функция для форматирования названия (первая буква заглавная)
  const formatName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // Функция для сортировки сырья по алфавиту
  const sortRawMaterials = (materials) => {
    return materials.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Загрузка данных при открытии страницы
  const loadRawMaterials = async () => {
    const rawMaterials = await fetchData('/api/raw-materials'); // Получаем данные с сервера
    const sortedMaterials = sortRawMaterials(rawMaterials); // Сортируем данные
    tableBody.innerHTML = sortedMaterials
      .map(
        (material) => `
        <tr>
          <td><input type="checkbox" class="select-checkbox" data-id="${material._id}"></td>
          <td>${material.name}</td>
          <td>${material.unit}</td>
          <td>${material.price.toFixed(2)}</td>
          <td>
            <button onclick="editRawMaterial('${material._id}')" class="edit-btn">Редактировать</button>
            <button onclick="deleteRawMaterial('${material._id}')" class="delete-btn">Удалить</button>
          </td>
        </tr>
      `
      )
      .join('');
  };

  // Добавление сырья
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = formatName(document.getElementById('raw-material-name').value.trim()); // Форматируем название
    const unit = document.getElementById('raw-material-unit').value;
    const price = parseFloat(document.getElementById('raw-material-price').value);

    // Валидация
    if (!name || !unit || isNaN(price) || price <= 0) {
      alert('Пожалуйста, заполните все поля корректно. Цена должна быть положительной.');
      return;
    }

    // Отправляем данные на сервер
    await postData('/api/raw-materials', { name, unit, price });
    loadRawMaterials(); // Обновляем таблицу
    form.reset(); // Очищаем форму
  });

  // Редактирование сырья
  window.editRawMaterial = async (id) => {
    const rawMaterials = await fetchData('/api/raw-materials');
    const material = rawMaterials.find((item) => item._id === id);

    const content = `
      <input type="text" id="edit-name" value="${material.name}" required>
      <select id="edit-unit" required>
        <option value="кг" ${material.unit === 'кг' ? 'selected' : ''}>кг</option>
        <option value="л" ${material.unit === 'л' ? 'selected' : ''}>л</option>
        <option value="шт" ${material.unit === 'шт' ? 'selected' : ''}>шт</option>
      </select>
      <input type="number" id="edit-price" value="${material.price.toFixed(2)}" step="0.01" required>
      <button type="submit" class="btn">Сохранить</button>
    `;
    openModal(content);

    document.getElementById('edit-form').onsubmit = async (e) => {
      e.preventDefault();
      material.name = formatName(document.getElementById('edit-name').value.trim()); // Форматируем название
      material.unit = document.getElementById('edit-unit').value;
      material.price = parseFloat(document.getElementById('edit-price').value);

      if (!material.name || !material.unit || isNaN(material.price) || material.price <= 0) {
        alert('Пожалуйста, заполните все поля корректно. Цена должна быть положительной.');
        return;
      }

      // Отправляем обновленные данные на сервер
      await postData(`/api/raw-materials/${id}`, material);
      loadRawMaterials(); // Обновляем таблицу
      document.getElementById('modal').style.display = 'none'; // Закрываем модальное окно
    };
  };

  // Удаление сырья
  window.deleteRawMaterial = async (id) => {
    if (confirm('Вы уверены, что хотите удалить этот элемент?')) {
      await deleteData(`/api/raw-materials/${id}`);
      loadRawMaterials(); // Обновляем таблицу
    }
  };

  // Выделить все чекбоксы при нажатии на чекбокс в шапке
  document.getElementById('select-all-checkbox').addEventListener('click', (e) => {
    const checkboxes = document.querySelectorAll('.select-checkbox');
    checkboxes.forEach((checkbox) => (checkbox.checked = e.target.checked));
  });

  // Удалить выбранные элементы
  document.getElementById('delete-selected').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('.select-checkbox:checked');

    if (checkboxes.length === 0) {
      alert('Выберите элементы для удаления.');
      return;
    }

    if (confirm('Вы уверены, что хотите удалить выбранные элементы?')) {
      const idsToDelete = Array.from(checkboxes).map((checkbox) =>
        checkbox.getAttribute('data-id')
      );

      // Удаляем каждый выбранный элемент
      for (const id of idsToDelete) {
        await deleteData(`/api/raw-materials/${id}`);
      }

      loadRawMaterials(); // Обновляем таблицу
    }
  });

  // Экспорт выбранных элементов в Excel
  document.getElementById('export-selected').addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('.select-checkbox:checked');

    if (checkboxes.length === 0) {
      alert('Выберите элементы для экспорта.');
      return;
    }

    const rawMaterials = await fetchData('/api/raw-materials');
    const selectedMaterials = Array.from(checkboxes).map((checkbox) =>
      rawMaterials.find((material) => material._id === checkbox.getAttribute('data-id'))
    );

    // Создаем массив данных для Excel
    const data = selectedMaterials.map((material) => [material.name, material.unit, material.price]);

    // Создаем новый рабочий лист
    const ws = XLSX.utils.aoa_to_sheet([['Название', 'Единица измерения', 'Цена (KGS)'], ...data]);

    // Создаем новую книгу и добавляем рабочий лист
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Сырьё');

    // Сохраняем файл
    XLSX.writeFile(wb, 'selected_raw_materials.xlsx');
  });

  // Загрузка данных при открытии страницы
  loadRawMaterials();
}
