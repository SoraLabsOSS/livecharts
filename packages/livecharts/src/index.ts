export function hello(name = "livecharts"): string {
  const message = `Hello from ${name}!`;
  console.log(message);
  return message;
}

hello();
