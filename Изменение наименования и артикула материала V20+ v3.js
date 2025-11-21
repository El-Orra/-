/**
 * Редактор материалов
 * Автор @orachevskaya и Gemini AI
 * Версия 3: Доработка для корректного сохранения типа погонного материала (профиля).
 *
 * Позволяет в циклическом режиме редактировать наименование, артикул и толщину
 * основного материала панели или профиля. Поддерживает сохранение текстуры и цвета.
 * * 1. (При первом запуске) Отредактируйте настройки сохранения ниже.
 * 2. Запустите скрипт.
 * 3. Нажмите "Выбрать объект" и выберите панель или профиль.
 * 4. Настройте параметры замены и нажмите "ОК".
 * 5. Настройки сохранятся автоматически при закрытии (если включено).
 */

// =========================================================================
// ===== ГЛАВНЫЕ НАСТРОЙКИ СОХРАНЕНИЯ (Редактировать здесь) =====
// =========================================================================

// Поставьте false, чтобы отключить автоматическое сохранение и загрузку настроек.
const REMEMBER_SETTINGS = true;

// ВАЖНО: Укажите здесь папку для хранения файла настроек.
// Скрипт НЕ МОЖЕТ автоматически определить свое местоположение.
const SETTINGS_FOLDER_PATH = 'C:\\BazisScriptSettings';

const SETTINGS_FILE_NAME = 'material_editor_settings.json';

// --- КОНЕЦ БЛОКА НАСТРОЕК ---


try {
	const fs = require('fs');
	const path = require('path');

	let selectedObject = null;
	const settingsPath = path.join(SETTINGS_FOLDER_PATH, SETTINGS_FILE_NAME);

	// --- 1. НАСТРОЙКИ ГЛАВНОГО ОКНА ---
	const form = UI.components.NewForm();
	form.Caption = 'Редактор материалов';
	form.Width = 700;
	form.Height = 340; // Уменьшили высоту
	form.Position = UI.constants.formPosition.screenCenter;

	// --- 2. НАСТРОЙКИ ПОЛЕЙ ВВОДА ---
	const nameLabel = UI.components.NewLabel(form, form);
	nameLabel.Caption = 'Материал';
	nameLabel.Top = 25; nameLabel.Left = 20;
	const nameEdit = UI.components.NewTextEdit(form, form);
	nameEdit.Top = 22; nameEdit.Left = 90; nameEdit.Width = 580;

	const articleLabel = UI.components.NewLabel(form, form);
	articleLabel.Caption = 'Артикул';
	articleLabel.Top = 65; articleLabel.Left = 20;
	const articleEdit = UI.components.NewTextEdit(form, form);
	articleEdit.Top = 62; articleEdit.Left = 90; articleEdit.Width = 580;

	const thicknessLabel = UI.components.NewLabel(form, form);
	thicknessLabel.Caption = 'Толщина';
	thicknessLabel.Top = 105; thicknessLabel.Left = 20;
	const thicknessEdit = UI.components.NewTextEdit(form, form);
	thicknessEdit.Top = 102; thicknessEdit.Left = 90; thicknessEdit.Width = 100;


	// --- 3. НАСТРОЙКИ ПАРАМЕТРОВ ---
	const scopeGroup = UI.components.NewRadioGroup(form, form);
	scopeGroup.Caption = 'Применить изменения:';
	scopeGroup.Top = 140; scopeGroup.Left = 90; scopeGroup.Width = 580; scopeGroup.Height = 65;
	scopeGroup.Properties.Items.Add().Caption = 'Только к выделенному объекту';
	scopeGroup.Properties.Items.Add().Caption = 'Ко всем объектам с этим материалом в модели';
	scopeGroup.ItemIndex = 0;

	const chkPreserveAppearance = UI.components.NewCheckBox(form, form);
	chkPreserveAppearance.Caption = 'Сохранять текстуру и цвет';
	chkPreserveAppearance.Top = 210; chkPreserveAppearance.Left = 90; chkPreserveAppearance.Width = 400;
	chkPreserveAppearance.Checked = true;

	// --- 4. НАСТРОЙКИ КНОПОК УПРАВЛЕНИЯ ---
	const buttonsTop = form.Height - 90;

	const btnSelect = UI.components.NewButton(form, form);
	btnSelect.Caption = 'Выбрать объект';
	btnSelect.Top = buttonsTop; btnSelect.Left = 20; btnSelect.Width = 160; btnSelect.Height = 40;

	const btnOk = UI.components.NewButton(form, form);
	btnOk.Caption = 'ОК';
	btnOk.Top = buttonsTop; btnOk.Left = 250; btnOk.Width = 100; btnOk.Height = 40;

	const btnCancel = UI.components.NewButton(form, form);
	btnCancel.Caption = 'Отмена';
	btnCancel.Top = buttonsTop; btnCancel.Left = 355; btnCancel.Width = 100; btnCancel.Height = 40;

	const btnFinish = UI.components.NewButton(form, form);
	btnFinish.Caption = 'Завершить';
	btnFinish.Top = buttonsTop; btnFinish.Left = 500; btnFinish.Width = 160; btnFinish.Height = 40;

	// --- ЛОГИКА ---
	function setEditMode(isEditing) {
		btnOk.Enabled = isEditing;
		btnCancel.Enabled = isEditing;
		nameEdit.Enabled = isEditing;
		articleEdit.Enabled = isEditing;
		thicknessEdit.Enabled = isEditing;
		scopeGroup.Enabled = isEditing;
		chkPreserveAppearance.Enabled = isEditing;
		btnSelect.Enabled = !isEditing;

		if (!isEditing) {
			nameEdit.Text = '';
			articleEdit.Text = '';
			thicknessEdit.Text = '';
		}
	}

	function loadSettings() {
		if (!REMEMBER_SETTINGS || !fs.existsSync(settingsPath)) return;
		try {
			const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
			scopeGroup.ItemIndex = settings.scope || 0;
			chkPreserveAppearance.Checked = (settings.preserveAppearance !== false);
		} catch (e) {
			console.log('Не удалось загрузить файл настроек: ' + e.message);
		}
	}

	function saveSettings() {
		if (!REMEMBER_SETTINGS) return;
		try {
			if (!fs.existsSync(SETTINGS_FOLDER_PATH)) {
				fs.mkdirSync(SETTINGS_FOLDER_PATH, {recursive: true});
			}
			const settings = {
				scope: scopeGroup.ItemIndex,
				preserveAppearance: chkPreserveAppearance.Checked
			};
			fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
		} catch (e) {
			console.log('Не удалось сохранить файл настроек: ' + e.message);
		}
	}

	// --- СОБЫТИЯ ---
	btnSelect.OnClick = function () {
		form.Hide();
		let newSelection = interaction.getRequest.GetObject('Укажите панель или профиль', new Set([objectTypeChecker.ObjectTypeValue.panel, objectTypeChecker.ObjectTypeValue.extrusion]));
		form.Show();
		if (newSelection) {
			selectedObject = newSelection;
			const material = selectedObject.Material;
			nameEdit.Text = materialData.ExtractMaterialName(material.MaterialName);
			articleEdit.Text = materialData.ExtractMaterialCode(material.MaterialName);
			thicknessEdit.Text = selectedObject.Thickness.toString();
			setEditMode(true);
		}
	};

	btnCancel.OnClick = function () {setEditMode(false);};

	btnFinish.OnClick = function () {form.Close();};

	form.OnClose = function () {
		saveSettings();
		execution.FinishExecution();
	};

	btnOk.OnClick = function () {
		if (!selectedObject) return;
		try {
			const newName = nameEdit.Text;
			const newArticle = articleEdit.Text;
			const newThickness = parseFloat(thicknessEdit.Text.replace(',', '.'));

			if (isNaN(newThickness) || newThickness <= 0) {
				UI.dialogs.ErrorBox("Некорректное значение толщины.");
				return;
			}

			const newFullName = newArticle ? (newName + '\r' + newArticle) : newName;
			const originalMaterial = selectedObject.Material;
			const originalFullName = originalMaterial.MaterialName;
			// [ИЗМЕНЕНИЕ] Получаем ширину исходного материала, чтобы сохранить тип.
			const originalMaterialWidth = selectedObject.MaterialWidth;
			const shouldChangeThickness = true;

			let newMaterialData;
			// [ИЗМЕНЕНИЕ] Если исходный материал был погонным (профилем), сохраняем его ширину.
			if (originalMaterialWidth > 0) {
				newMaterialData = materialData.CreateMaterialData(newFullName, newThickness, originalMaterialWidth);
			} else {
				// Иначе создаем листовой материал, не передавая третий параметр.
				newMaterialData = materialData.CreateMaterialData(newFullName, newThickness);
			}


			if (scopeGroup.ItemIndex === 0) { // Только к выделенному
				historyOperations.RegisterObjectChanging(selectedObject, false);
				materialData.SetupObjectMaterial(selectedObject, newMaterialData, shouldChangeThickness);

				if (chkPreserveAppearance.Checked) {
					const newMaterial = selectedObject.Material;
					newMaterial.Path = originalMaterial.PathAbsolute();
					newMaterial.DiffuseColor = originalMaterial.DiffuseColor;
				}
				selectedObject.Build();

			} else { // Ко всем объектам с этим материалом
				let objectsToUpdate = [];
				batchProcessing.ForEachObjectInList(currentFileData.model, function (obj) {
					// Ищем по имени материала и проверяем, что это панель или профиль
					if (obj.Material && obj.Material.MaterialName === originalFullName &&
						(objectTypeChecker.ObjectIsPanel(obj) || objectTypeChecker.ObjectIsExtrusionBody(obj))) {
						objectsToUpdate.push(obj);
					}
				});
				if (objectsToUpdate.length > 0) {
					objectsToUpdate.forEach(function (obj) {historyOperations.RegisterObjectChanging(obj, false);});

					objectsToUpdate.forEach(function (obj) {materialData.SetupObjectMaterial(obj, newMaterialData, shouldChangeThickness);});

					if (chkPreserveAppearance.Checked) {
						const newSharedMaterial = objectsToUpdate[0].Material;
						newSharedMaterial.Path = originalMaterial.PathAbsolute();
						newSharedMaterial.DiffuseColor = originalMaterial.DiffuseColor;
					}
					objectsToUpdate.forEach(function (obj) {obj.Build();});
				}
			}
			historyOperations.CommitCurrentChanges('Замена материала');
			setEditMode(false);
		} catch (e) {
			UI.dialogs.ErrorBox("Ошибка при применении изменений:\n" + e.message);
		}
	};

	// --- ИНИЦИАЛИЗАЦИЯ ---
	loadSettings();
	setEditMode(false);
	form.Show();
	execution.ContinueExecution();

} catch (e) {
	UI.dialogs.ErrorBox("Произошла критическая ошибка при запуске скрипта:\n" + e.message);
}