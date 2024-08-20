import pandas as pd

df = pd.read_csv("public/top-1000.csv")

subset = df["id"]

l = []
for i in subset:
    l.append(i)

print(l)