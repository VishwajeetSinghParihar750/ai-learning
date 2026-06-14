

def mag(v):
    ans:int = 0
    for item in v:
        ans += item ** 2
    ans **= .5
    return ans

print(mag([3, 4]));

