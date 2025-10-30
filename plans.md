# Add new features


- find a way to detect what kind of models we have plus what do they support


```js
  const { list } = await oa({
    model: "magistral:latest",
    stream: false,
  });
```


### Next what do i need?

- Create support for paping different models?


- What should the source tab support?

- website fetching
- file loading (csv, json, xml)

sequncal
pipe(
  source,
  prompt("Extract the income statments data"),
  prompt("Extract the income statements data"),
)

in parallerl
parallel(
  source,
  prompt("Extract the income statments data"),
  prompt("Extract the income statements data"),
)
