const compute = (x) => {
  x += 100;
  console.log("compute done");
  return x;
};

const dfs = (a, b = compute(10)) => {
  if (a > 5) return;
  console.log("work sth");
  dfs(a + 1, b);
};

// dfs(0);

const s = "helo";
const ss = `你好我是${s}`;
console.log(ss);
