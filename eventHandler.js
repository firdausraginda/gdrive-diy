// Initialize Firebase
var config = {
    apiKey: "AIzaSyBB5Gs4QUlbt8Vd2VXppk4OpEcgYiaXE98",
    authDomain: "gdrive-diy.firebaseapp.com",
    databaseURL: "https://gdrive-diy.firebaseio.com",
    projectId: "gdrive-diy",
    storageBucket: "gdrive-diy.appspot.com",
    messagingSenderId: "884644123381"
};
var defaultApp = firebase.initializeApp(config);
var firestore = defaultApp.firestore()
var storage = defaultApp.storage()

// DOM element
const addFileBtn = document.querySelector('.addBtn')
const addForm = document.querySelector('.addForm')
const closeAddFormBtn = document.querySelector('.fa-times')
const browseBtn = document.querySelector('#upload-file')
const labelBrowse = document.querySelector('label')
const checkBtn = document.querySelector('.fa-check-circle')
const fileTable = document.querySelector('#fileTable')
const loader = document.querySelector('.loader')

// var global
let fileBrowse = null
let urlDownload = null

getAllFiles = function () {
    showHeaderTable()
    firestore
        .collection("files")
        .get()
        .then(data => {
            let counter = 0
            data.forEach(element => {
                counter += 1
                showListData(counter, element.data().fileName, element.data().fileLocation)
            })
        })
}

// function init input condition
inputInit = function () {
    fileBrowse = null
    urlDownload = null
    labelBrowse.innerHTML = 'browse file...'
}

// function add header table static
showHeaderTable = function () {
    html =
        `
    <tr>
        <th>No</th>
        <th>File Name</th>
        <th>Actions</th>
    </tr>
    `
    fileTable.insertAdjacentHTML('beforeend', html)
}

// function show list of files
showListData = function (no, fileName, fileLoc) {
    html =
        `
    <tr id="id-%id%">
        <td>%no%</td>
        <td>%fileName%</td>
        <td>
            <a href="%url%" target="blank">
                <i class="fas fa-file-download"></i>
            </a>
            <i class="fas fa-trash-alt"></i>
        </td>
    </tr>
    `
    newHtml = html.replace('%id%', fileName)
    newHtml = newHtml.replace('%no%', no)
    newHtml = newHtml.replace('%url%', fileLoc)
    newHtml = newHtml.replace('%fileName%', fileName)

    fileTable.insertAdjacentHTML('beforeend', newHtml)
}

// init system
getAllFiles()

// handle add file btn
addFileBtn.addEventListener('click', () => {
    addForm.style.display = 'block'
})

// handle close btn in addForm
closeAddFormBtn.addEventListener('click', () => {
    addForm.style.display = 'none'
    inputInit()
})

// handle browse file
browseBtn.addEventListener('change', (e) => {
    if (e.target.files.length != 0) {
        fileBrowse = e.target.files[0]
        let lenValInput = parseInt(fileBrowse.name.length)
        if (lenValInput > 35) {
            labelBrowse.innerHTML = fileBrowse.name.substring(0, 35) + '...'
        } else {
            labelBrowse.innerHTML = fileBrowse.name.substring(0, 35)
        }
    }
})

// handle check btn
checkBtn.addEventListener('click', () => {
    if (fileBrowse != null) {
        loader.style.display = 'block'
        closeAddFormBtn.style.display = 'none'
        checkBtn.style.visibility = 'hidden'
        let storageRef = storage.ref("files/" + fileBrowse.name);
        storageRef.put(fileBrowse)
            .then(() => {
                let fileLink = storage.ref(`files/${fileBrowse.name}`);
                urlDownload = fileLink.getDownloadURL()
                    .then(url => {
                        urlDownload = url.toString()
                    })
                    .then(() => {
                        let docRef = firestore.collection("files")
                        let query = docRef.where("fileName", "==", fileBrowse.name)
                        query
                            .get()
                            .then(data => {
                                if (data.size == 0) {
                                    docRef
                                        .add({
                                            fileName: fileBrowse.name,
                                            fileLocation: urlDownload
                                        })
                                    loader.style.display = 'none'
                                    closeAddFormBtn.style.display = 'block'
                                    checkBtn.style.visibility = 'visible'
                                    fileTable.innerHTML = ''
                                    getAllFiles()
                                    inputInit()
                                } else {
                                    alert('file name is duplicate')
                                }
                            })
                    })
            })
    } else {
        alert('Please choose a file')
    }
})

// handle delete
fileTable.addEventListener('click', (e) => {
    let targetId = e.target.parentNode.parentNode.id
    if (targetId.match('id-')) {
        let sureDel = confirm('Are you sure want to delete this file?')
        if (sureDel) {
            let idFile = targetId.substring(3, targetId.length)
            firestore
                .collection("files")
                .where("fileName", "==", idFile)
                .get()
                .then(data => {
                    data.forEach(element => {
                        element.ref.delete()
                            .then(() => {
                                let storageRef = storage.ref("files/" + idFile);
                                storageRef.delete()
                                    .then(() => {
                                        fileTable.innerHTML = ''
                                        getAllFiles()
                                        inputInit()
                                    })
                            })
                    })
                })
        }
    }
})