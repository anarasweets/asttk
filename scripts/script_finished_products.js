// Универсальные функции
const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];

// Открытие и закрытие модального окна
const toggleModal = (modalId, show) => {
  const modal = document.getElementById(modalId);
  modal.style.display = show ? "block" : "none";
};

// Логика для страницы "Готовая продукция"
if (window.location.pathname.includes("finished_products.html")) {
  const form = document.getElementById("add-finished-product-form");
  const tableBody = document.querySelector("#finished-products-table tbody");
  const ingredientsList = document.getElementById("ingredients-list");
  const rawMaterialSelect = document.getElementById("raw-material-select");
  const ingredientQuantity = document.getElementById("ingredient-quantity");
  const selectAllCheckbox = document.getElementById("select-all");
  const deleteSelectedButton = document.getElementById("delete-selected");
  const exportSelectedButton = document.getElementById("export-selected");
  const exportSimplifiedButton = document.getElementById("export-simplified");

  let ingredients = [];
  let editIndex = null;

  // Загрузка сырья и полуфабрикатов
  const rawMaterials = getData("rawMaterials");
  const semiProducts = getData("semiProducts");

  // Заполнение выпадающего списка сырья и полуфабрикатов
  const loadMaterials = () => {
    rawMaterialSelect.innerHTML = '<option value="" disabled selected>Выберите сырьё или полуфабрикат</option>';
    
    // Сортировка сырья по алфавиту
    rawMaterials.sort((a, b) => a.name.localeCompare(b.name));

    // Добавление сырья в выпадающий список
    rawMaterials.forEach((material) => {
      const option = document.createElement("option");
      option.value = material.name;
      option.textContent = `${material.name} (${material.unit}) - Сырьё`;
      rawMaterialSelect.appendChild(option);
    });

    // Сортировка полуфабрикатов по алфавиту
    semiProducts.sort((a, b) => a.name.localeCompare(b.name));

    // Добавление полуфабрикатов в выпадающий список
    semiProducts.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.name;
      option.textContent = `${product.name} (${product.outputUnit}) - Полуфабрикат`;
      rawMaterialSelect.appendChild(option);
    });

    // Инициализация select2 для выпадающего списка
    $(rawMaterialSelect).select2({
      placeholder: "Выберите сырьё или полуфабрикат",
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
      alert("Пожалуйста, выберите сырьё или полуфабрикат и укажите количество.");
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

  // Расчет себестоимости продукции
  const calculateCost = (ingredients) => {
    return ingredients.reduce((total, ingredient) => {
      // Поиск в сырье
      const material = rawMaterials.find((m) => m.name === ingredient.name);
      if (material) {
        return total + material.price * ingredient.quantity;
      }

      // Поиск в полуфабрикатах
      const semiProduct = semiProducts.find((p) => p.name === ingredient.name);
      if (semiProduct) {
        return total + (semiProduct.cost / semiProduct.output) * ingredient.quantity;
      }

      return total;
    }, 0);
  };

  // Сохранение продукции
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const finishedProducts = getData("finishedProducts");
    const name = "ГП " + document.getElementById("finished-product-name").value.trim();
    const output = parseFloat(document.getElementById("finished-product-output").value);
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
      finishedProducts[editIndex] = newProduct;
      editIndex = null;
    } else {
      finishedProducts.push(newProduct);
    }

    saveData("finishedProducts", finishedProducts);
    loadFinishedProducts();
    form.reset();
    ingredients = [];
    updateIngredientsList();
    toggleModal("modal-create", false);
  });

  // Загрузка готовой продукции
  const loadFinishedProducts = () => {
    const finishedProducts = getData("finishedProducts");
    tableBody.innerHTML = finishedProducts
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
            <button onclick="editFinishedProduct(${index})" class="edit-btn">Редактировать</button>
            <button onclick="deleteFinishedProduct(${index})" class="delete-btn">Удалить</button>
          </td>
        </tr>
      `
      )
      .join("");
  };

  // Удаление продукции
  window.deleteFinishedProduct = (index) => {
    const finishedProducts = getData("finishedProducts");
    if (confirm("Вы уверены, что хотите удалить эту продукцию?")) {
      finishedProducts.splice(index, 1);
      saveData("finishedProducts", finishedProducts);
      loadFinishedProducts();
    }
  };

  // Редактирование продукции
  window.editFinishedProduct = (index) => {
    const finishedProducts = getData("finishedProducts");
    const product = finishedProducts[index];

    document.getElementById("finished-product-name").value = product.name.replace("ГП ", "");
    document.getElementById("finished-product-output").value = product.output;
    document.getElementById("output-unit").value = product.outputUnit;
    ingredients = [...product.ingredients];
    updateIngredientsList();

    editIndex = index;
    toggleModal("modal-create", true);
  };

  // Сортировка таблицы по столбцам
  const sortTable = (columnIndex, sortDirection) => {
    const finishedProducts = getData("finishedProducts");

    finishedProducts.sort((a, b) => {
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

    saveData("finishedProducts", finishedProducts);
    loadFinishedProducts();
  };

  // Добавление обработчиков сортировки для заголовков таблицы
  document.querySelectorAll("#finished-products-table th").forEach((header, index) => {
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

  // Выбор всей продукции
  selectAllCheckbox.addEventListener("change", (e) => {
    const checkboxes = document.querySelectorAll(".product-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = e.target.checked;
    });
  });

  // Удаление выбранной продукции
  deleteSelectedButton.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".product-checkbox:checked");
    if (checkboxes.length === 0) {
      alert("Пожалуйста, выберите хотя бы одну продукцию для удаления.");
      return;
    }

    if (confirm("Вы уверены, что хотите удалить выбранную продукцию?")) {
      const finishedProducts = getData("finishedProducts");
      const indicesToDelete = Array.from(checkboxes).map((checkbox) => parseInt(checkbox.dataset.index));
      indicesToDelete.sort((a, b) => b - a);
      indicesToDelete.forEach((index) => {
        finishedProducts.splice(index, 1);
      });
      saveData("finishedProducts", finishedProducts);
      loadFinishedProducts();
    }
  });

  // Экспорт выбранной продукции
exportSelectedButton.addEventListener("click", async () => {
  try {
    const checkboxes = document.querySelectorAll(".product-checkbox:checked");
    if (checkboxes.length === 0) {
      alert("Пожалуйста, выберите хотя бы одну продукцию для экспорта.");
      return;
    }

    const finishedProducts = getData("finishedProducts");
    const rawMaterials = getData("rawMaterials");
    const semiProducts = getData("semiProducts");
    const selectedIndices = Array.from(checkboxes).map((checkbox) => parseInt(checkbox.dataset.index));

    const workbook = new ExcelJS.Workbook();

    selectedIndices.forEach((index) => {
      const product = finishedProducts[index];
      const worksheet = workbook.addWorksheet(product.name.slice(0, 31)); // Ограничение длины названия листа

      // Заголовок ТТК
      worksheet.addRow(["Технико-технологическая карта"]);
      worksheet.addRow(["Наименование продукции:", product.name]);
      worksheet.addRow(["Выход продукции (" + product.outputUnit + "):", product.output]);
      worksheet.addRow(["Себестоимость за порцию (KGS):", product.cost]);
      worksheet.addRow(["Себестоимость за единицу (KGS):", (product.cost / product.output).toFixed(2)]);
      worksheet.addRow([]);

      // Заголовки таблицы ингредиентов
      worksheet.addRow(["Ингредиенты", "Количество", "Единица измерения", "Цена за единицу (KGS)", "Стоимость (KGS)"]);

      // Добавление данных об ингредиентах
      product.ingredients.forEach((ingredient) => {
        // Поиск в сырье
        const material = rawMaterials.find((m) => m.name === ingredient.name);
        if (material) {
          worksheet.addRow([
            ingredient.name,
            ingredient.quantity,
            material.unit,
            material.price.toFixed(2),
            (material.price * ingredient.quantity).toFixed(2),
          ]);
        } else {
          // Поиск в полуфабрикатах
          const semiProduct = semiProducts.find((p) => p.name === ingredient.name);
          if (semiProduct) {
            worksheet.addRow([
              ingredient.name,
              ingredient.quantity,
              semiProduct.outputUnit,
              (semiProduct.cost / semiProduct.output).toFixed(2),
              ((semiProduct.cost / semiProduct.output) * ingredient.quantity).toFixed(2),
            ]);
          } else {
            console.log("Ингредиент не найден ни в сырье, ни в полуфабрикатах:", ingredient.name);
          }
        }
      });

      // Объединение ячеек A1:E1
      worksheet.mergeCells("A1:E1");

      // Стилизация заголовка (A1:E1)
      const titleRow = worksheet.getRow(1);
      titleRow.eachCell((cell) => {
        cell.font = { bold: true, size: 14 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Стилизация ячеек A2:A5 (жирный шрифт)
      for (let i = 2; i <= 5; i++) {
        const row = worksheet.getRow(i);
        row.getCell(1).font = { bold: true };
      }

      // Числовой формат для ячеек B4:B5
      for (let i = 4; i <= 5; i++) {
        const row = worksheet.getRow(i);
        row.getCell(2).numFmt = '#,##0.00'; // Числовой формат с двумя десятичными знаками и разделителем групп разрядов
      }

      // Числовой формат для ячеек D8:E99
      for (let i = 8; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell, colNumber) => {
          if (colNumber >= 4 && colNumber <= 5) { // Столбцы D и E
            cell.numFmt = '#,##0.00'; // Числовой формат с двумя десятичными знаками и разделителем групп разрядов
          }
        });
      }

      // Стилизация заголовков таблицы ингредиентов (строка 7)
      const headerRow = worksheet.getRow(7);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFB7DEE8' } // Голубой фон
        };
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Границы для всех ячеек с данными
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } }
          };
        });
      }

      // Выравнивание по центру для ячеек B2:E999
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        row.eachCell((cell, colNumber) => {
          if (colNumber >= 2 && colNumber <= 5) { // Столбцы B, C, D, E
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      }

      // Автоматическое выравнивание ширины столбцов
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          let cellLength = cellValue.length;

          // Учитываем форматирование чисел
          if (cell.numFmt && typeof cell.value === 'number') {
            const formattedValue = cell.value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            cellLength = formattedValue.length;
          }

          // Учитываем длину символов Unicode
          const unicodeLength = Array.from(cellValue).length;
          maxLength = Math.max(maxLength, unicodeLength, cellLength);
        });

        // Устанавливаем ширину столбца
        column.width = Math.max(10, maxLength + 2); // Минимальная ширина 10, +2 для отступов
      });
    });

    // Создание файла и его скачивание
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Технико-технологические_карты_продукции.xlsx';
    link.click();
  } catch (error) {
    console.error("Ошибка при экспорте данных:", error);
    alert("Произошла ошибка при экспорте данных. Пожалуйста, попробуйте снова.");
  }
});

  // Упрощённый экспорт всех ГП на одном листе
  exportSimplifiedButton.addEventListener("click", async () => {
    const finishedProducts = getData("finishedProducts");

    if (finishedProducts.length === 0) {
      alert("Нет данных для экспорта.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Готовая продукция");

    // Заголовки таблицы
    worksheet.addRow(["Название", "Единица измерения", "Себестоимость за порцию", "Себестоимость за единицу", "Выход"]);

    // Добавление данных
    finishedProducts.forEach((product) => {
      worksheet.addRow([
        product.name,
        product.outputUnit,
        parseFloat(product.cost), // Преобразуем в число
        parseFloat((product.cost / product.output).toFixed(2)), // Преобразуем в число
        parseFloat(product.output), // Преобразуем в число
      ]);
    });

    // Стилизация заголовков
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFB7DEE8' } // Голубой фон
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Границы для всех ячеек с данными
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
      });
    }

    // Выравнивание по центру для ячеек B2:E999
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.eachCell((cell, colNumber) => {
        if (colNumber >= 2 && colNumber <= 5) { // Столбцы B, C, D, E
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    }

    // Числовой формат для ячеек C2:E999
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.eachCell((cell, colNumber) => {
        if (colNumber >= 3 && colNumber <= 5) { // Столбцы C, D, E
          cell.numFmt = '#,##0.00'; // Числовой формат с двумя десятичными знаками и разделителем групп разрядов
        }
      });
    }

    // Автоматическое выравнивание ширины столбцов
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        const cellLength = cellValue.length;
        maxLength = Math.max(maxLength, cellLength);
      });
      column.width = Math.max(10, maxLength + 2); // Минимальная ширина 10, +2 для отступов
    });

    // Создание файла и его скачивание
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Готовая_продукция_упрощённый.xlsx';
    link.click();
  });

  // Открытие модального окна для создания продукции
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
  loadMaterials();
  loadFinishedProducts();
}