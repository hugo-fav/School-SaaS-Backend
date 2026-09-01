import createHttpError from "../errors/createHttpError.js";

export const ensureExists = (resource, name) => {
  if (!resource) {
    throw createHttpError(404, `${name} not found`);
  }

  return resource;
};
