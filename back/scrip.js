function addRow() {
    let table = document.getElementById("planningTable").getElementsByTagName('tbody')[0];
    let newRow = table.insertRow();
    for (let i = 0; i < 3; i++) {
        let cell = newRow.insertCell(i);
        cell.contentEditable = "true";
    }
    let deleteCell = newRow.insertCell(3);
    deleteCell.innerHTML = '<button onclick="deleteRow(this)">Supprimer</button>';
}

function deleteRow(button) {
    let row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
}
