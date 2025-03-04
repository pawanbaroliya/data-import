const httpStatus = require('http-status');
const { clone, map, merge } = require('lodash');

const { Projects, Columns } = require('../models');

/**
 * Load project and append to req.
 * @public
 */
exports.getProject = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    // loading project with it's templates
    const [data] = await Projects.aggregate([
      { $addFields: { id: { $toString: '$_id' } } },
      { $match: { id: projectId } },
      {
        $lookup: {
          from: 'templates',
          pipeline: [{ $match: { 'p.id': projectId } }],
          as: 'templates'
        }
      }
    ]);

    // making promises of templates's columns
    const templatePromises = [];
    data.templates &&
      data.templates.forEach(async (template, index) =>
        templatePromises.push(Columns.find({ tId: template._id }))
      );

    // after columns promises get's resolve making payload and sending it.
    await Promise.all(templatePromises).then(r => {
      const payload = clone(data);
      payload.templates = map(payload.templates, (template, index) => {
        return merge(template, { columns: r[index] });
      });
      res.send(payload);
    });
  } catch (error) {
    next(error);
  }
};

exports.show = async (req, res, next) => {
  const ObjectId = require('mongoose').Types.ObjectId;
  const { projectId } = req.params;
  let project = {};
  if (ObjectId.isValid(projectId)) {
    project = await Projects.findOne({ _id: projectId }, ['nm', 'cd', 'cbUrl']).populate(
      'templates',
      {
        nm: 1,
        cd: 1,
        cbUrl: 1,
        p: -1
      }
    );
  } else {
    project = await Projects.findOne({ cd: projectId }, ['nm', 'cd', 'cbUrl']).populate(
      'templates',
      {
        nm: 1,
        cd: 1,
        cbUrl: 1,
        p: -1
      }
    );
  }

  if (project) {
    const templates = [];
    project.templates.forEach(template => {
      templates.push(template.toAliasedFieldsObject());
    });
    project = project.toAliasedFieldsObject();
    project.templates = templates;
  }
  res.send(project);
};

/**
 * Get project list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const projects = await Projects.paginate(req.query);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

/**
 *
 * @param {Project} req
 * @param {id, firstName, lastName} res
 * @param {*} next
 */
exports.create = async (req, res, next) => {
  try {
    const project = new Projects(req.body);
    const saved = await project.save();
    res.status(httpStatus.CREATED);
    res.json(saved);
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing project
 * @public
 */
exports.update = (req, res, next) => {
  res.send(httpStatus.OK);
};
