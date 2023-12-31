const express = require('express');
const router = express.Router();
const webhookCreateController = require('../controller/webhookCreateController');
const webhookUpdateController = require('../controller/webhookUpdateController');
const webhookTimeController = require('../controller/webhookTimeController');

// This array contains the different route paths
const cretaeRoutes = [
    '/createtask1',
    '/createtask2',
    '/createtask3',
    '/createtask4',
    '/createtasktest'
    // Add more routes as needed
  ];

  const updateRoutes = [
    '/updatetask1',
    '/updatetask2',
    '/updatetask3',
    '/updatetask4',
    '/updatetasktest'
    // Add more routes as needed
  ];
  
  // Initialize the task processing flag for each route
  const taskProcessingFlags = {};
  
  // Set up routes for each task
  cretaeRoutes.forEach(route => {
    taskProcessingFlags[route] = false;
  
    router.post(route, async (req, res) => {
      const isTaskProcessing = taskProcessingFlags[route];
      if (isTaskProcessing) {
        // If a task is already being processed, return an error response or handle it accordingly
        return res.status(429).send('Task is already being processed. Try again later.');
      }
  
      taskProcessingFlags[route] = true;
  
      try {
        // Call your createTask function here
        await webhookCreateController.createTask(req, res);
      } catch (error) {
        console.error('Error processing task:', error);
      } finally {
        taskProcessingFlags[route] = false;
      }
    });
  });

  updateRoutes.forEach(route => {
    taskProcessingFlags[route] = false;
  
    router.post(route, async (req, res) => {
      const isTaskProcessing = taskProcessingFlags[route];
      if (isTaskProcessing) {
        // If a task is already being processed, return an error response or handle it accordingly
        return res.status(429).send('Task is already being processed. Try again later.');
      }
  
      taskProcessingFlags[route] = true;
  
      try {
        // Call your createTask function here
        await webhookUpdateController.updateTask(req, res);
      } catch (error) {
        console.error('Error processing task:', error);
      } finally {
        taskProcessingFlags[route] = false;
      }
    });
  });
  
  module.exports = router;