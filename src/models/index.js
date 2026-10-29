// src/models/index.js
import "server-only";
import TaskAssignee from "@/models/TaskAssignee";
import sequelize from "@/lib/sequelize";
import User from "@/models/User";
import Project from "@/models/Project";
import ProjectMember from "@/models/ProjectMember";
import Task from "@/models/Task";
import ActivityLog from "@/models/ActivityLog";
import Notification from "@/models/Notification";
import TaskComment from "@/models/TaskComment";

if (!Project.associations.owner) {
  Project.belongsTo(User, {
    foreignKey: "owner_id",
    as: "owner",
  });
}

if (!User.associations.ownedProjects) {
  User.hasMany(Project, {
    foreignKey: "owner_id",
    as: "ownedProjects",
  });
}

if (!Project.associations.projectMemberships) {
  Project.hasMany(ProjectMember, {
    foreignKey: "project_id",
    as: "projectMemberships",
  });
}

if (!ProjectMember.associations.project) {
  ProjectMember.belongsTo(Project, {
    foreignKey: "project_id",
    as: "project",
  });
}

if (!User.associations.projectMemberships) {
  User.hasMany(ProjectMember, {
    foreignKey: "user_id",
    as: "projectMemberships",
  });
}

if (!ProjectMember.associations.user) {
  ProjectMember.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
}

if (!Project.associations.tasks) {
  Project.hasMany(Task, {
    foreignKey: "project_id",
    as: "tasks",
  });
}
if (!Task.associations.project) {
  Task.belongsTo(Project, {
    foreignKey: "project_id",
    as: "project",
  });
}
if (!User.associations.assignedTasks) {
  User.hasMany(Task, {
    foreignKey: "assigned_to",
    as: "assignedTasks",
  });
}

if (!Task.associations.assignee) {
  Task.belongsTo(User, {
    foreignKey: "assigned_to",
    as: "assignee",
  });
}

// Task ↔ TaskAssignee
if (!Task.associations.taskAssignees) {
  Task.hasMany(TaskAssignee, {
    foreignKey: "task_id",
    as: "taskAssignees",
  });
}

if (!TaskAssignee.associations.task) {
  TaskAssignee.belongsTo(Task, {
    foreignKey: "task_id",
    as: "task",
  });
}

// User ↔ TaskAssignee
if (!User.associations.taskAssignments) {
  User.hasMany(TaskAssignee, {
    foreignKey: "user_id",
    as: "taskAssignments",
  });
}

if (!TaskAssignee.associations.user) {
  TaskAssignee.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
}
// ActivityLog → User
if (!ActivityLog.associations.user) {
  ActivityLog.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
}

// ActivityLog → Project
if (!ActivityLog.associations.project) {
  ActivityLog.belongsTo(Project, {
    foreignKey: "project_id",
    as: "project",
  });
}

// ActivityLog → Task
if (!ActivityLog.associations.task) {
  ActivityLog.belongsTo(Task, {
    foreignKey: "task_id",
    as: "task",
  });
}
// Notification associations
if (!Notification.associations.user) {
  Notification.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
}

if (!Notification.associations.project) {
  Notification.belongsTo(Project, {
    foreignKey: "project_id",
    as: "project",
  });
}

if (!Notification.associations.task) {
  Notification.belongsTo(Task, {
    foreignKey: "task_id",
    as: "task",
  });
}

if (!Notification.associations.activityLog) {
  Notification.belongsTo(ActivityLog, {
    foreignKey: "activity_log_id",
    as: "activityLog",
  });
}


 // TaskComment → Task
if (!TaskComment.associations.task) {
  TaskComment.belongsTo(Task, {
    foreignKey: "task_id",
    as: "task",
  });
}

if (!Task.associations.comments) {
  Task.hasMany(TaskComment, {
    foreignKey: "task_id",
    as: "comments",
  });
}

// TaskComment → User
if (!TaskComment.associations.user) {
  TaskComment.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
  });
}

if (!User.associations.taskComments) {
  User.hasMany(TaskComment, {
    foreignKey: "user_id",
    as: "taskComments",
  });
}
if (!TaskComment.associations.parentComment) {
  TaskComment.belongsTo(TaskComment, {
    foreignKey: "parent_comment_id",
    as: "parentComment",
  });
}

if (!TaskComment.associations.replies) {
  TaskComment.hasMany(TaskComment, {
    foreignKey: "parent_comment_id",
    as: "replies",
  });
}

export {
  sequelize,
  User,
  Project,
  ProjectMember,
  Notification,
  Task,
  TaskAssignee,
  ActivityLog,
  TaskComment
};