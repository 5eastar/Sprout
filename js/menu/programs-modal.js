// programs-modal.js — ProgramModalManager class.
// Handles the add/edit program modal (identify-home, cats-home) and the standalone programs page.
// Requires: program-manager.js (getAllPrograms, saveAllPrograms, compressImage)

class ProgramModalManager {
    constructor() {
        this.modal = document.getElementById('programModal');
        this.closeBtn = document.getElementById('closeModal');
        this.openBtn = document.getElementById('openProgramModal');

        // Tabs
        this.tabAdd = document.getElementById('tabAdd');
        this.tabEdit = document.getElementById('tabEdit');
        this.addSection = document.getElementById('addProgramSection');
        this.editSection = document.getElementById('editProgramSection');

        // Add program form
        this.programForm = document.getElementById('programForm');
        this.addStimulusBtn = document.getElementById('addStimulusBtn');
        this.stimuliContainer = document.getElementById('stimuliContainer');
        this.addStimulusField();

        // Edit program dropdown
        this.programDropdown = document.getElementById('programSelectDropdown');
        this.editContainer = document.getElementById('editStimuliContainer');
        this.addEditStimulusBtn = document.getElementById('addEditStimulusBtn');
        this.saveEditsBtn = document.getElementById('saveEditsBtn');

        // State
        this.currentEditProgramIndex = null;
        this.stimulusCounter = 0;

        // Track accumulated images per stimulus field
        this.accumulatedImages = {};

        this.init();
    }

    init() {
        // Modal controls
        this.openBtn?.addEventListener('click', () => this.openModal());
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Tab switching
        this.tabAdd?.addEventListener('click', () => this.switchTab('add'));
        this.tabEdit?.addEventListener('click', () => this.switchTab('edit'));


        // Add program functionality
        this.addStimulusBtn?.addEventListener('click', () => this.addStimulusField());
        this.programForm?.addEventListener('submit', (e) => this.saveNewProgram(e));

        // Edit program functionality
        this.programDropdown?.addEventListener('change', (e) => this.loadProgramForEdit(e.target.value));
        this.addEditStimulusBtn?.addEventListener('click', () => this.addEditStimulusField());
        this.saveEditsBtn?.addEventListener('click', () => this.saveEdits());

        // Toggle image sections based on text-only checkbox
        const textOnlyCheckbox = document.getElementById('new-program-text-only');
        textOnlyCheckbox?.addEventListener('change', () => {
            const show = !textOnlyCheckbox.checked;
            this.stimuliContainer?.querySelectorAll('.imageUploadSection').forEach(section => {
                section.style.display = show ? '' : 'none';
            });
        });

        // Add import button functionality
        const importBtn = document.getElementById('importProgramsBtn');
        importBtn?.addEventListener('click', async () => {
            try {
                const programs = await importPrograms();
                if (programs) {
                    alert('✓ Programs loaded successfully!\n\nRefresh the page to see changes.');
                    window.location.reload();
                }
            } catch (error) {
                alert('Failed to import: ' + error.message);
            }
        });
    }

    openModal() {
        this.modal?.classList.remove('hidden');
        this.modal?.classList.add('show');
        this.switchTab('add');
    }

    closeModal() {
        this.modal?.classList.remove('show');
        this.modal?.classList.add('hidden');
        this.resetForms();
    }

    async switchTab(tab) {
        if (tab === 'add') {
            this.addSection?.classList.add('show');
            this.addSection?.classList.remove('hidden');
            this.editSection?.classList.add('hidden');
            this.editSection?.classList.remove('show');
            this.tabAdd?.classList.add('active');
            this.tabEdit?.classList.remove('active');
        } else {
            this.editSection?.classList.add('show');
            this.editSection?.classList.remove('hidden');
            this.addSection?.classList.add('hidden');
            this.addSection?.classList.remove('show');
            this.tabEdit?.classList.add('active');
            this.tabAdd?.classList.remove('active');
            await this.populateEditDropdown();
        }
    }

    // ===== ADD PROGRAM FUNCTIONALITY =====

    addStimulusField() {
        const stimulusId = `stimulus-${this.stimulusCounter++}`;
        const div = document.createElement('div');
        div.className = 'stimulus-field';
        div.dataset.stimulusId = stimulusId;

        // Initialize empty array for this stimulus
        if (!this.accumulatedImages) {
            this.accumulatedImages = {};
        }
        this.accumulatedImages[stimulusId] = [];

        div.innerHTML = `
            Targets:
            <input type="text" placeholder="Target Name (e.g., Chicken)" class="stimulusName" required />
            <div class="imageUploadSection" id="imageSection-${stimulusId}">
                <input type="file" accept="image/*" multiple class="stimulusImages" data-id="${stimulusId}" />
                <div class="image-preview-container" id="preview-${stimulusId}"></div>
                <p style="font-size:0.8rem; color:#666; margin-top:4px;">Images: <span id="count-${stimulusId}">0</span>/4</p>
            </div>
            <button type="button" class="btn-remove" onclick="programModal.removeStimulusField('${stimulusId}')">Remove</button>
        `;

        // Add file change listener for accumulation
        const fileInput = div.querySelector('.stimulusImages');
        fileInput.addEventListener('change', (e) => this.accumulateImages(e, stimulusId));

        this.stimuliContainer?.appendChild(div);

        const textOnlyCheckbox = document.getElementById('new-program-text-only');
        if (textOnlyCheckbox?.checked) {
            div.querySelector('.imageUploadSection').style.display = 'none';
        }
    }

    removeStimulusField(stimulusId) {
        const field = document.querySelector(`[data-stimulus-id="${stimulusId}"]`);
        if (field) {
            field.remove();
            delete this.accumulatedImages[stimulusId];
        }
    }

    async accumulateImages(event, stimulusId) {
        const input = event.target;
        const newFiles = Array.from(input.files);

        // Get current accumulated images
        const currentImages = this.accumulatedImages[stimulusId] || [];

        // Calculate how many we can add
        const spaceLeft = 4 - currentImages.length;

        if (spaceLeft === 0) {
            alert("Maximum 4 images per target reached.");
            input.value = ''; // Clear the input
            return;
        }

        if (newFiles.length > spaceLeft) {
            alert(`You can only add ${spaceLeft} more image(s).`);
        }

        // Take only what we can fit
        const filesToAdd = newFiles.slice(0, spaceLeft);

        // Process and add new images
        for (const file of filesToAdd) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentImages.push(e.target.result);
                this.updateImagePreview(stimulusId);
            };
            reader.readAsDataURL(file);
        }

        // Clear the file input
        input.value = '';
    }

    updateImagePreview(stimulusId) {
        const previewContainer = document.getElementById(`preview-${stimulusId}`);
        const countSpan = document.getElementById(`count-${stimulusId}`);
        const images = this.accumulatedImages[stimulusId] || [];

        if (!previewContainer) return;

        previewContainer.innerHTML = '';

        images.forEach((imgSrc, index) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:inline-block; position:relative; margin:4px;';

            const img = document.createElement('img');
            img.src = imgSrc;
            img.style.cssText = 'width:60px; height:60px; object-fit:cover; border-radius:4px;';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            removeBtn.style.cssText = 'position:absolute; top:-5px; right:-5px; background:#e53e3e; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:14px; line-height:1; font-weight:bold;';
            removeBtn.onclick = () => {
                images.splice(index, 1);
                this.updateImagePreview(stimulusId);
            };

            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            previewContainer.appendChild(wrapper);
        });

        if (countSpan) {
            countSpan.textContent = images.length;
        }
    }

    async saveNewProgram(e) {
        e.preventDefault();

        const programNameInput = this.programForm.querySelector('input[type="text"]');
        const programName = programNameInput?.value.trim();
        const textOnlyCheckbox = document.getElementById('new-program-text-only');
        const isTextOnlyProgram = textOnlyCheckbox?.checked || false;

        if (!programName) {
            alert('Please enter a program name');
            return;
        }

        const stimulusFields = this.stimuliContainer?.querySelectorAll('.stimulus-field');
        const stimuli = [];

        // Show progress
        const saveBtn = this.programForm.querySelector('button[type="submit"]');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Processing...';

        try {
            if (stimulusFields) {
                for (const field of stimulusFields) {
                    const nameInput = field.querySelector('.stimulusName');
                    const stimulusId = field.dataset.stimulusId;
                    const name = nameInput?.value.trim();

                    if (!name) continue;

                    const images = [];

                    if (!isTextOnlyProgram) {
                        // Get accumulated images for this stimulus
                        const accumulatedImgs = this.accumulatedImages[stimulusId] || [];

                        if (accumulatedImgs.length === 0) {
                            alert(`Stimulus "${name}" needs at least one image (or check "Text-only program")`);
                            saveBtn.disabled = false;
                            saveBtn.textContent = originalText;
                            return;
                        }

                        saveBtn.textContent = 'Compressing images...';

                        // Compress accumulated images
                        for (const imgDataUrl of accumulatedImgs) {
                            const [header, b64] = imgDataUrl.split(',');
                            const mime = header.match(/:(.*?);/)[1];
                            const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
                            const file = new File([bytes], 'image.jpg', { type: mime });
                            const compressed = await compressImage(file);
                            images.push(compressed);
                        }
                    }

                    stimuli.push({
                        name,
                        images: isTextOnlyProgram ? [] : images,
                        textOnly: isTextOnlyProgram
                    });
                }
            }

            if (stimuli.length === 0) {
                alert('Please add at least one stimulus');
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                return;
            }

            saveBtn.textContent = 'Saving...';

            // Create new program
            const newProgram = {
                name: programName,
                stimulus: stimuli,
                custom: true,
                editable: true,
                showQuestionText: true,
                textOnly: isTextOnlyProgram
            };

            // Add to all programs
            const allPrograms = await getAllPrograms();
            allPrograms.push(newProgram);

            if (await saveAllPrograms(allPrograms)) {
                // Refresh program list immediately (uses cached data)
                if (typeof loadPrograms === 'function') {
                    await loadPrograms();
                }

                this.resetForms();
                this.closeModal();
            }
        } catch (error) {
            console.error('Error saving program:', error);
            alert('Error saving program. Please try again with fewer or smaller images.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    // ===== EDIT PROGRAM FUNCTIONALITY =====

    async populateEditDropdown() {
        if (!this.programDropdown) return;

        this.programDropdown.innerHTML = '<option value="">-- Select Program --</option>';

        const allPrograms = await getAllPrograms();

        allPrograms.forEach((program, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${program.name}`;
            this.programDropdown.appendChild(option);
        });

        if (allPrograms.length === 0) {
            this.editContainer.innerHTML = '<p style="text-align:center; color:#666;">No programs available.</p>';
        } else {
            this.editContainer.innerHTML = '<p style="text-align:center; color:#666;">Select a program above to edit.</p>';
        }
    }

    async loadProgramForEdit(value) {
        if (!value || value === '') {
            this.editContainer.innerHTML = '<p style="text-align:center; color:#666;">Select a program above to edit.</p>';
            this.currentEditProgramIndex = null;
            return;
        }

        const index = parseInt(value);
        const allPrograms = await getAllPrograms();
        const program = allPrograms[index];

        if (!program) {
            this.editContainer.innerHTML = '<p style="color:red;">Program not found.</p>';
            return;
        }

        this.currentEditProgramIndex = index;
        this.renderEditStimuli(program);
    }

    renderEditStimuli(program) {
        const infoMessage = program.builtin ? `
            <div></div>
        ` : '';

        const deleteButton = `
            <button type="button" id="delete-program-btn" class="btn-danger"
                    style="background:#e53e3e; color:white; padding:8px 16px; border:none; border-radius:6px; cursor:pointer; margin-top:10px;">
                🗑️ Delete Program
            </button>
        `;

        this.editContainer.innerHTML = `
            ${infoMessage}
            <div style="margin-bottom: 15px;">
                <label style="font-weight:600; color:#333;">Program Name:</label>
                <input type="text" id="edit-program-name" value="${escapeHTML(program.name)}"
                       style="width:100%; padding:8px; border:2px solid #e2e8f0; border-radius:6px; margin-top:5px;" />
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; gap: 8px; font-weight:600; color:#333;">
                    <input type="checkbox" id="show-question-text" ${program.showQuestionText !== false ? 'checked' : ''} />
                    <span>Show question text during game</span>
                </label>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; gap: 8px; font-weight:600; color:#333;">
                    <input type="checkbox" id="text-only-program" ${program.textOnly ? 'checked' : ''} />
                    <span>Text-only program (no images needed for any target)</span>
                </label>
            </div>
            <h3 style="margin-top:20px; margin-bottom:10px; color:#333;">Stimuli:</h3>
            <div id="edit-stimuli-list"></div>
            ${deleteButton}
        `;

        // Add delete button listener
        const deleteBtn = document.getElementById('delete-program-btn');
        deleteBtn?.addEventListener('click', () => this.deleteProgram());

        const stimuliList = document.getElementById('edit-stimuli-list');

        program.stimulus.forEach((stim, index) => {
            const stimDiv = document.createElement('div');
            stimDiv.className = 'edit-stimulus-item';
            stimDiv.dataset.index = index;
            stimDiv.style.cssText = 'background:#f7fafc; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid #e2e8f0;';

            const isTextOnly = stim.textOnly || false;
            const imagesHTML = isTextOnly ? '<p style="color:#666; font-style:italic;">Text-only stimulus (no images)</p>' :
                stim.images.map((img, i) =>
                    `<div style="display:inline-block; position:relative; margin:4px;">
                        <img src="${img}" style="width:60px; height:60px; object-fit:cover; border-radius:4px;" />
                        <button type="button" class="img-remove-btn" data-stim-index="${index}" data-img-index="${i}"
                                style="position:absolute; top:-5px; right:-5px; background:#e53e3e; color:white; border:none;
                                       border-radius:50%; width:20px; height:20px; cursor:pointer; font-size:12px; line-height:1;">×</button>
                    </div>`
                ).join('');

            stimDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <input type="text" class="edit-stim-name" value="${escapeHTML(stim.name)}"
                           style="flex:1; padding:6px; border:2px solid #e2e8f0; border-radius:6px; margin-right:10px;" />
                    <button type="button" class="btn-remove" onclick="programModal.removeEditStimulus(${index})">Remove Stimulus</button>
                </div>
                <div style="margin-bottom:8px;" class="images-container">${imagesHTML}</div>
                <div class="image-upload-section" style="display: ${isTextOnly ? 'none' : 'block'}">
                    <input type="file" accept="image/*" multiple class="edit-stim-images" data-index="${index}"
                           style="font-size:0.85rem;" />
                    <p style="font-size:0.8rem; color:#666; margin-top:4px;">Add images to append, or remove existing images above</p>
                </div>
            `;

            stimuliList.appendChild(stimDiv);
        });

        // Add event listeners for image remove buttons
        document.querySelectorAll('.img-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stimIndex = parseInt(e.target.dataset.stimIndex);
                const imgIndex = parseInt(e.target.dataset.imgIndex);
                this.removeImageFromStimulus(stimIndex, imgIndex);
            });
        });
    }

    removeImageFromStimulus(stimIndex, imgIndex) {
        const stimItem = document.querySelector(`.edit-stimulus-item[data-index="${stimIndex}"]`);
        if (!stimItem) return;

        // Get current images
        const imagesContainer = stimItem.querySelector('.images-container');
        const images = Array.from(imagesContainer.querySelectorAll('img'));

        if (images.length <= 1) {
            alert('Each stimulus must have at least one image. Add new images before removing the last one.');
            return;
        }

        if (confirm('Remove this image?')) {
            // Remove the image div
            const imgDivs = imagesContainer.querySelectorAll('div');
            if (imgDivs[imgIndex]) {
                imgDivs[imgIndex].remove();
            }
        }
    }

    addEditStimulusField() {
        if (this.currentEditProgramIndex === null) {
            alert('Please select a program first');
            return;
        }

        const stimuliList = document.getElementById('edit-stimuli-list');
        if (!stimuliList) return;

        const newIndex = stimuliList.children.length;
        const stimDiv = document.createElement('div');
        stimDiv.className = 'edit-stimulus-item';
        stimDiv.dataset.index = newIndex;
        stimDiv.dataset.isNew = 'true';
        stimDiv.style.cssText = 'background:#f7fafc; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid #e2e8f0;';

        stimDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <input type="text" class="edit-stim-name" placeholder="Stimulus name"
                       style="flex:1; padding:6px; border:2px solid #e2e8f0; border-radius:6px; margin-right:10px;" />
                <button type="button" class="btn-remove" onclick="this.parentElement.parentElement.remove()">Remove</button>
            </div>
            <div class="image-upload-section">
                <input type="file" accept="image/*" multiple class="edit-stim-images" data-index="${newIndex}"
                       style="font-size:0.85rem;" />
            </div>
        `;

        stimuliList.appendChild(stimDiv);
    }

    removeEditStimulus(index) {
        const stimItem = document.querySelector(`.edit-stimulus-item[data-index="${index}"]`);
        if (stimItem && confirm('Please confirm you want to remove this stimulus?')) {
            stimItem.remove();
        }
    }

    async saveEdits() {
        if (this.currentEditProgramIndex === null) {
            alert('No program selected');
            return;
        }

        const programNameInput = document.getElementById('edit-program-name');
        const programName = programNameInput?.value.trim();
        const showQuestionText = document.getElementById('show-question-text')?.checked !== false;
        const textOnlyProgram = document.getElementById('text-only-program')?.checked || false;

        if (!programName) {
            alert('Please enter a program name');
            return;
        }

        const stimuliItems = document.querySelectorAll('.edit-stimulus-item');
        const stimuli = [];

        // Show progress
        this.saveEditsBtn.disabled = true;
        const originalText = this.saveEditsBtn.textContent;
        this.saveEditsBtn.textContent = 'Processing...';

        try {
            for (const item of stimuliItems) {
                const nameInput = item.querySelector('.edit-stim-name');
                const fileInput = item.querySelector('.edit-stim-images');
                const name = nameInput?.value.trim();

                if (!name) continue;

                let images = [];

                // If new stimulus, must have files or program is text-only
                if (item.dataset.isNew === 'true') {
                    if (!textOnlyProgram && (!fileInput?.files || fileInput.files.length === 0)) {
                        alert(`Please add images for "${name}" or check "Text-only program"`);
                        this.saveEditsBtn.disabled = false;
                        this.saveEditsBtn.textContent = originalText;
                        return;
                    }

                    if (!textOnlyProgram) {
                        this.saveEditsBtn.textContent = 'Compressing new images...';
                        const files = Array.from(fileInput.files).slice(0, 4);
                        for (const file of files) {
                            const compressed = await compressImage(file);
                            images.push(compressed);
                        }
                    }
                } else {
                    // Existing stimulus
                    if (!textOnlyProgram) {
                        const imagesContainer = item.querySelector('.images-container');
                        const existingImages = Array.from(imagesContainer.querySelectorAll('img')).map(img => img.src);

                        images = [...existingImages];

                        // If new files provided, compress and add them
                        if (fileInput?.files && fileInput.files.length > 0) {
                            this.saveEditsBtn.textContent = 'Compressing additional images...';
                            const files = Array.from(fileInput.files).slice(0, 4 - images.length);
                            for (const file of files) {
                                const compressed = await compressImage(file);
                                images.push(compressed);
                            }
                        }
                    }
                }

                if (!textOnlyProgram && images.length === 0) {
                    alert(`Stimulus "${name}" must have at least one image or mark program as text-only`);
                    this.saveEditsBtn.disabled = false;
                    this.saveEditsBtn.textContent = originalText;
                    return;
                }

                stimuli.push({
                    name,
                    images: textOnlyProgram ? [] : images,
                    textOnly: textOnlyProgram
                });
            }

            if (stimuli.length === 0) {
                alert('Please add at least one stimulus');
                this.saveEditsBtn.disabled = false;
                this.saveEditsBtn.textContent = originalText;
                return;
            }

            this.saveEditsBtn.textContent = 'Saving...';

            // Get all programs
            const allPrograms = await getAllPrograms();
            const originalProgram = allPrograms[this.currentEditProgramIndex];

            // Update the program in place
            allPrograms[this.currentEditProgramIndex] = {
                ...originalProgram,
                name: programName,
                stimulus: stimuli,
                builtin: originalProgram?.builtin || false,
                custom: originalProgram?.custom || false,
                editable: true,
                showQuestionText: showQuestionText,
                textOnly: textOnlyProgram
            };

            if (await saveAllPrograms(allPrograms)) {
                // Refresh program list immediately
                if (typeof loadPrograms === 'function') {
                    loadPrograms();
                }

                // Refresh edit view
                await this.populateEditDropdown();
                this.programDropdown.value = this.currentEditProgramIndex;
                await this.loadProgramForEdit(this.programDropdown.value);
            }

        } catch (error) {
            console.error('Error updating program:', error);
            alert('Error updating program. Please try again with fewer or smaller images.');
        } finally {
            this.saveEditsBtn.disabled = false;
            this.saveEditsBtn.textContent = originalText;
        }
    }

    async deleteProgram() {
        if (this.currentEditProgramIndex === null) {
            alert('No program selected');
            return;
        }

        const allPrograms = await getAllPrograms();
        const program = allPrograms[this.currentEditProgramIndex];

        if (!program) return;

        if (allPrograms.length <= 1) {
            alert('Cannot delete the last program! Create another program first.');
            return;
        }

        if (confirm(`Are you sure you want to delete "${program.name}"?\n\nThis cannot be undone.`)) {
            allPrograms.splice(this.currentEditProgramIndex, 1);

            if (await saveAllPrograms(allPrograms)) {
                alert('Program deleted successfully!');

                // Refresh program list in main menu
                if (typeof loadPrograms === 'function') {
                    loadPrograms();
                }

                // Reset edit view
                this.currentEditProgramIndex = null;
                this.populateEditDropdown();
            }
        }
    }

    // ===== UTILITY =====

    resetForms() {
        // Reset add form
        this.programForm?.reset();
        if (this.stimuliContainer) {
            this.stimuliContainer.innerHTML = '';
            this.addStimulusField();
        }

        // Clear accumulated images
        this.accumulatedImages = {};

        // Reset edit form
        this.currentEditProgramIndex = null;
        if (this.programDropdown) this.programDropdown.value = '';
        this.editContainer.innerHTML = '<p style="text-align:center; color:#666;">Select a program above to edit.</p>';

        this.stimulusCounter = 0;
    }
}

// Initialize when DOM is ready — assign to window so inline onclick handlers can reach it
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.programModal = new ProgramModalManager();

        // Trigger initial program list load on pages that have a program dropdown
        if (typeof loadPrograms === 'function') {
            loadPrograms();
        }
    }, 100);
});
