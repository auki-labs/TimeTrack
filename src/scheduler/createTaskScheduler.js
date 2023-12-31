const db = require('../config');
const axios = require('axios');
const { TT_TOKEN, ASANA_TOKEN, ASANA_PROJECTGID,USER_MAP,log, USER_NAME } = require('../constants/constants');
const {getTaskDetails,STATUS_ID,PRIORITY_ID,PROJECTS} = require('../constants/constants');
const {loadAWSSecret} = require("../../config/secreteManagerConfig");
async function verifyTasks() {
    let asanaSecret = await loadAWSSecret("timetrack/api/asana");
    let timetaskSecret = await loadAWSSecret("timetrack/api/timetask");
    let taskIDfromDB = await getDocumentIDs();
    let all_asanaTaskGID = [];

    for (const id of ASANA_PROJECTGID) {
        let current_asanaTaskGID = await getAlltask(id, asanaSecret['PRABHATH PANICKER']);
        for (let i = 0; i < current_asanaTaskGID.length; i++) {
            let currentGid = current_asanaTaskGID[i].gid;
            all_asanaTaskGID.push(currentGid);
        }
    }
    let missingGIDs = all_asanaTaskGID.filter(gid => !taskIDfromDB.includes(gid));
    for (const id of missingGIDs) {
        let taskDetails = await getTaskDetails(id, asanaSecret['PRABHATH PANICKER']);
        console.log(taskDetails)
        let requestData = await createReqData(taskDetails);
        console.log(requestData,"requestData");
        let response = await postTask(requestData, timetaskSecret[USER_NAME[requestData.ownerid]]);
        console.log(response,"response");
        requestData.current_tt_taskID = response.task.id;
        requestData.ownerName = USER_NAME[requestData.ownerid];
        requestData.current_tt_worktypeID = PROJECTS[taskDetails.data.projects[0].name]
        console.log(`${requestData.title} Task Created`);
        // Add requestData key-value pairs to global_task_manager collection
        const docRef = db.collection("global_task_manager").doc(id);
        await docRef.set({
        ...requestData
        });
    }
}


async function getDocumentIDs() {
    var collectionRef = db.collection("global_task_manager");

    return collectionRef.get().then((querySnapshot) => {
        var taskIDfromDB = [];

        querySnapshot.forEach((doc) => {
            taskIDfromDB.push(doc.id);
        });

        return taskIDfromDB;
    }).catch((error) => {
        console.error("Error getting documents:", error);
        return [];
    });
}

async function getAlltask(project_gid,token) {
    try {
        const response = await axios.get(`https://app.asana.com/api/1.0/projects/${project_gid}/tasks`, {
            headers: {
                Authorization: token,
            },
        });
        return response.data.data;
    } catch (error) {
        console.log(`[ERROR] Error getting all task from asana: ${error}`);
        throw error;
    }
}
async function createReqData(taskDetails) {
    let requestData = {
      "statusid": STATUS_ID,
      "priorityid": PRIORITY_ID
    };
    requestData.projectid = PROJECTS[taskDetails.data.projects[0].name];
    requestData.title = taskDetails.data.name;
    requestData.dateopen = convertToDateOnly(taskDetails.data.created_at);
    console.log(taskDetails.data.followers,"taskDetails.followers")
    requestData.ownerid = USER_MAP[taskDetails.data.followers[0].gid];
    requestData.moduleid = 450029;
    if (taskDetails.data.assignee != null) {
      requestData.assigneeid = USER_MAP[taskDetails.data.assignee.gid];
    }
    if (taskDetails.data.notes != null) {
      requestData.summary = taskDetails.data.notes;
    }
    if (taskDetails.data.due_on != null) {
      requestData.datedue = taskDetails.data.due_on;
    }
    log(`[Task Name]${requestData.title}`);
    return requestData;
  }

  function convertToDateOnly(dateString) {
    const date = new Date(dateString);
    const convertedDate = date.toISOString().split("T")[0];
    return convertedDate;
  }

async function postTask(data, apiKey) {
    console.log(data,apiKey);
    const authHeader = 'Basic ' + Buffer.from(apiKey + ':' + '').toString('base64');
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.myintervals.com/task/',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      data: data
    };
  
    return axios.request(config)
      .then((response) => {
        log(`[INFO] ${data.title} Task Creation Completed`)
        return response.data; // Return the response data
      })
      .catch((error) => {
        console.log(error);
        log(`[ERROR] Error while updating a task : ${error}`)
      });
  }
module.exports = {
    verifyTasks
}