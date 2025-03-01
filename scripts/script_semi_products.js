// Универсальные функции
const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];

// Открытие и закрытие модального окна
const toggleModal = (modalId, show) => {
  const modal = document.getElementById(modalId);
  modal.style.display = show ? "block" : "none";
};

// Логика для страницы "Полуфабрикаты"
if (window.location.pathname.includes("semi_products.html")) {
  const form = document.getElementById("add-semi-product-form");
  const tableBody = document.querySelector("#semi-products-table tbody");
  const ingredientsList = document.getElementById("ingredients-list");
  const rawMaterialSelect = document.getElementById("raw-material-select");
  const ingredientQuantity = document.getElementById("ingredient-quantity");
  const selectAllCheckbox = document.getElementById("select-all");
  const deleteSelectedButton = document.getElementById("delete-selected");
  const exportSelectedButton = document.getElementById("export-selected");

  let ingredients = [];
  let editIndex = null;

  // Загрузка сырья
  const rawMaterials = getData("rawMaterials");

  // Заполнение выпадающего списка сырья с сортировкой по алфавиту
  const loadRawMaterials = () => {
    rawMaterialSelect.innerHTML = '<option value="" disabled selected>Выберите сырьё</option>';
    
    // Сортировка сырья по алфавиту
    rawMaterials.sort((a, b) => a.name.localeCompare(b.name));

    rawMaterials.forEach((material) => {
      const option = document.createElement("option");
      option.value = material.name;
      option.textContent = `${material.name} (${material.unit})`;
      rawMaterialSelect.appendChild(option);
    });

    // Инициализация select2 для выпадающего списка
    $(rawMaterialSelect).select2({
      placeholder: "Выберите сырьё",
      allowClear: true,
      width: '100%', // Ширина выпадающего списка
      dropdownParent: $('#modal-create') // Привязка к модальному окну
    });
  };

  // Добавление ингредиента
  document.getElementById("add-ingredient").addEventListener("click", () => {
    const selectedMaterial = rawMaterialSelect.value;
    const quantity = parseFloat(ingredientQuantity.value);

    if (!selectedMaterial || isNaN(quantity) || quantity <= 0) {
      alert("Пожалуйста, выберите сырьё и укажите количество.");
      return;
    }

    ingredients.push({ name: selectedMaterial, quantity });
    updateIngredientsList();
    ingredientQuantity.value = "";
  });

  // Обновление списка ингредиентов
  const updateIngredientsList = () => {
    ingredientsList.innerHTML = ingredients
      .map(
        (ingredient, index) => `
        <div class="ingredient">
          ${ingredient.name} - ${ingredient.quantity}
          <button onclick="removeIngredient(${index})" class="delete-btn">Удалить</button>
        </div>
      `
      )
      .join("");
  };

  // Удаление ингредиента
  window.removeIngredient = (index) => {
    ingredients.splice(index, 1);
    updateIngredientsList();
  };

  // Расчет себестоимости полуфабриката
  const calculateCost = (ingredients) => {
    return ingredients.reduce((total, ingredient) => {
      const material = rawMaterials.find((m) => m.name === ingredient.name);
      return material ? total + material.price * ingredient.quantity : total;
    }, 0);
  };

  // Сохранение полуфабриката
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const semiProducts = getData("semiProducts");
    const name = "ПФ " + document.getElementById("semi-product-name").value.trim();
    const output = parseFloat(document.getElementById("semi-product-output").value);
    const outputUnit = document.getElementById("output-unit").value;

    if (!name || ingredients.length === 0 || isNaN(output) || output <= 0) {
      alert("Пожалуйста, заполните все поля корректно.");
      return;
    }

    const cost = calculateCost(ingredients);
    const newProduct = {
      name,
      ingredients: [...ingredients],
      cost: cost.toFixed(2), // Себестоимость за порцию
      output,
      outputUnit,
    };

    if (editIndex !== null) {
      semiProducts[editIndex] = newProduct;
      editIndex = null;
    } else {
      semiProducts.push(newProduct);
    }

    saveData("semiProducts", semiProducts);
    loadSemiProducts();
    form.reset();
    ingredients = [];
    updateIngredientsList();
    toggleModal("modal-create", false);
  });

  // Загрузка полуфабрикатов
  const loadSemiProducts = () => {
    const semiProducts = getData("semiProducts");
    tableBody.innerHTML = semiProducts
      .map(
        (product, index) => `
        <tr>
          <td><input type="checkbox" class="product-checkbox" data-index="${index}"></td>
          <td>${product.name}</td>
          <td>${product.ingredients.map((i) => `${i.name} - ${i.quantity}`).join(", ")}</td>
          <td>${product.outputUnit}</td>
          <td>${product.cost}</td> <!-- Себестоимость за порцию -->
          <td>${(product.cost / product.output).toFixed(2)}</td> <!-- Себестоимость за единицу -->
          <td>${product.output}</td>
          <td>
            <button onclick="editSemiProduct(${index})" class="edit-btn">Редактировать</button>
            <button onclick="deleteSemiProduct(${index})" class="delete-btn">Удалить</button>
          </td>
        </tr>
      `
      )
      .join("");
  };

  // Удаление полуфабриката
  window.deleteSemiProduct = (index) => {
    const semiProducts = getData("semiProducts");
    if (confirm("Вы уверены, что хотите удалить этот полуфабрикат?")) {
      semiProducts.splice(index, 1);
      saveData("semiProducts", semiProducts);
      loadSemiProducts();
    }
  };

  // Редактирование полуфабриката
  window.editSemiProduct = (index) => {
    const semiProducts = getData("semiProducts");
    const product = semiProducts[index];

    document.getElementById("semi-product-name").value = product.name.replace("ПФ ", "");
    document.getElementById("semi-product-output").value = product.output;
    document.getElementById("output-unit").value = product.outputUnit;
    ingredients = [...product.ingredients];
    updateIngredientsList();

    editIndex = index;
    toggleModal("modal-create", true);
  };

  // Сортировка таблицы по столбцам
  const sortTable = (columnIndex, sortDirection) => {
    const semiProducts = getData("semiProducts");

    semiProducts.sort((a, b) => {
      let valueA, valueB;

      switch (columnIndex) {
        case 1: // Название
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 2: // Ингредиенты
          valueA = a.ingredients.map((i) => `${i.name} - ${i.quantity}`).join(", ").toLowerCase();
          valueB = b.ingredients.map((i) => `${i.name} - ${i.quantity}`).join(", ").toLowerCase();
          break;
        case 3: // Единица измерения
          valueA = a.outputUnit.toLowerCase();
          valueB = b.outputUnit.toLowerCase();
          break;
        case 4: // Себестоимость за порцию
          valueA = parseFloat(a.cost);
          valueB = parseFloat(b.cost);
          break;
        case 5: // Себестоимость за единицу
          valueA = parseFloat(a.cost / a.output);
          valueB = parseFloat(b.cost / b.output);
          break;
        case 6: // Выход
          valueA = parseFloat(a.output);
          valueB = parseFloat(b.output);
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    saveData("semiProducts", semiProducts);
    loadSemiProducts();
  };

  // Добавление обработчиков сортировки для заголовков таблицы
  document.querySelectorAll("#semi-products-table th").forEach((header, index) => {
    if (index > 0) { // Исключаем первый столбец с чекбоксами
      header.style.cursor = "pointer"; // Делаем заголовки кликабельными
      header.addEventListener("click", () => {
        const currentDirection = header.getAttribute("data-sort-direction") || "asc";
        const newDirection = currentDirection === "asc" ? "desc" : "asc";
        header.setAttribute("data-sort-direction", newDirection);
        sortTable(index, newDirection);
      });
    }
  });

  // Выбор всех полуфабрикатов
  selectAllCheckbox.addEventListener("change", (e) => {
    const checkboxes = document.querySelectorAll(".product-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = e.target.checked;
    });
  });

  // Удаление выбранных полуфабрикатов
  deleteSelectedButton.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".product-checkbox:checked");
    if (checkboxes.length === 0) {
      alert("Пожалуйста, выберите хотя бы один полуфабрикат для удаления.");
      return;
    }

    if (confirm("Вы уверены, что хотите удалить выбранные полуфабрикаты?")) {
      const semiProducts = getData("semiProducts");
      const indicesToDelete = Array.from(checkboxes).map((checkbox) => parseInt(checkbox.dataset.index));
      indicesToDelete.sort((a, b) => b - a);
      indicesToDelete.forEach((index) => {
        semiProducts.splice(index, 1);
      });
      saveData("semiProducts", semiProducts);
      loadSemiProducts();
    }
  });

  // Экспорт выбранных полуфабрикатов
 exportSelectedButton.addEventListener("click", async () => {
  const checkboxes = document.querySelectorAll(".product-checkbox:checked");
  if (checkboxes.length === 0) {
    alert("Пожалуйста, выберите хотя бы один полуфабрикат для экспорта.");
    return;
  }

  const semiProducts = getData("semiProducts");
  const rawMaterials = getData("rawMaterials");
  const selectedIndices = Array.from(checkboxes).map((checkbox) => parseInt(checkbox.dataset.index));

  const workbook = new ExcelJS.Workbook();

  selectedIndices.forEach((index) => {
    const product = semiProducts[index];
    const worksheet = workbook.addWorksheet(product.name.slice(0, 31));

    worksheet.addRow(["Технико-технологическая карта"]);
    worksheet.addRow(["Наименование полуфабриката:", product.name]);
    worksheet.addRow(["Выход продукции (" + product.outputUnit + "):", product.output]);
    worksheet.addRow(["Себестоимость за порцию (KGS):", product.cost]);
    worksheet.addRow(["Себестоимость за единицу (KGS):", (product.cost / product.output).toFixed(2)]);
    worksheet.addRow([]);
    worksheet.addRow(["Ингредиенты", "Количество", "Единица измерения", "Цена за единицу (KGS)", "Стоимость (KGS)"]);

    product.ingredients.forEach((ingredient) => {
      const material = rawMaterials.find((m) => m.name === ingredient.name);
      if (material) {
        worksheet.addRow([
          ingredient.name,
          ingredient.quantity,
          material.unit,
          material.price.toFixed(2),
          (material.price * ingredient.quantity).toFixed(2),
        ]);
      }
    });

    worksheet.mergeCells("A1:E1");

    const firstRow = worksheet.getRow(1);
    firstRow.getCell(1).font = { bold: true, size: 14 };
    firstRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    for (let i = 2; i <= 5; i++) {
      const row = worksheet.getRow(i);
      row.getCell(1).font = { bold: true };
      row.getCell(1).border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
      row.getCell(2).border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
    }

    worksheet.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell('B3').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell('B4').alignment = { horizontal: 'center', vertical: 'middle' };
worksheet.getCell('B5').alignment = { horizontal: 'center', vertical: 'middle' };

    const headerRow = worksheet.getRow(7);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB7DEE8' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    for (let i = 7; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.eachCell((cell, colNumber) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };

        if (colNumber === 2 && i === 3) {
          cell.numFmt = '#,##0';
        } else if (
          (colNumber === 2 && i === 4) ||
          (colNumber === 2 && i >= 7) ||
          (colNumber === 4 && i >= 7) ||
          (colNumber === 5 && i >= 7)
        ) {
          cell.numFmt = '#,##0.00';
        }
      });
    }

    // Автоматическое выравнивание ширины столбцов по содержимому
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        const cellLength = cellValue.length;

        // Учитываем длину текста и форматирование (например, числа с двумя знаками после запятой)
        if (cell.numFmt === '#,##0.00' && typeof cell.value === 'number') {
          const formattedValue = cell.value.toFixed(2);
          maxLength = Math.max(maxLength, formattedValue.length);
        } else {
          maxLength = Math.max(maxLength, cellLength);
        }
      });

      // Устанавливаем ширину столбца на основе максимальной длины содержимого
      column.width = Math.max(10, maxLength + 2); // Минимальная ширина 10, +2 для отступов
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'Технико-технологические_карты_полуфабрикатов.xlsx';
  link.click();
});

  // Открытие модального окна для создания полуфабриката
  document.getElementById("open-modal").addEventListener("click", () => {
    editIndex = null;
    toggleModal("modal-create", true);
  });

  // Закрытие модального окна при нажатии на крестик
  document.querySelector("#modal-create .close").addEventListener("click", () => {
    toggleModal("modal-create", false);
  });

  // Закрытие модального окна при клике вне его области
  window.addEventListener("click", (event) => {
    if (event.target === document.getElementById("modal-create")) {
      toggleModal("modal-create", false);
    }
  });

  // Загрузка данных при открытии страницы
  loadRawMaterials();
  loadSemiProducts();
}