// import axios from "axios";

// const createTreeFeatures = async (treeObj) => {
//   const { name, path } = treeObj;
//   delete treeObj.name;
//   delete treeObj.path;
//   const res = await axios({
//     method: "POST",
//     url: "http://124.222.128.21:3000/api/v1/trees/features",
//     data: {
//       name,
//       path,
//       features: JSON.stringify(treeObj),
//     },
//   });
//   console.log(res);
// };

// const getTreeFeatures = async (tree) => {
//   const res = await axios({
//     method: "GET",
//     url: "http://124.222.128.21:3000/api/v1/trees/features",
//     params: {
//       name: tree,
//     },
//   });
//   const { status, content } = res.data;
//   let treeObj;
//   if (status === "success") {
//     treeObj = {
//       name: content.treeFeatures.name,
//       path: content.treeFeatures.path,
//       ...JSON.parse(content.treeFeatures.features),
//     };
//   }
//   return treeObj;
// };

// const createTree = async (skeleton, isInstanced, matrixArr, matricesArr) => {
//   const res = await axios({
//     method: "POST",
//     url: "http://124.222.128.21:3000/api/v1/trees",
//     data: {
//       skeleton: JSON.stringify(skeleton),
//       isInstanced: isInstanced,
//       matrix: matrixArr,
//       matrices: matricesArr,
//     },
//   });
//   console.log(res);
// };

// const getTrees = async () => {
//   const res = await axios({
//     method: "GET",
//     url: "http://124.222.128.21:3000/api/v1/trees",
//   });
//   return res.data.content.trees;
// };

// export { createTreeFeatures, getTreeFeatures, getTrees, createTree };
