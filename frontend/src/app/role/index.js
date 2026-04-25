const roles = {};

const mergeNestedObjects = (obj) => {
  const merged = {};
  Object.values(obj).forEach((subObj) => {
    Object.assign(merged, subObj);
  });
  return merged;
};

const importAllRoles = async () => {
  const modules = import.meta.glob('./*.js', { eager: true });

  for (const path in modules) {
    if (path !== './index.js') {
      Object.assign(roles, modules[path]);
    }
  }
};

importAllRoles();

let tempRoles = {}
Object.values(roles).map((value)=>{
  tempRoles = {...tempRoles, ...value}
})
const mergedRoles = mergeNestedObjects(roles);
export default mergedRoles;
