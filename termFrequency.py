def tf(document ) :
    words = document.split()
    tf = {}
    for word in words:
        if word not in tf:
            tf[word] = 0
        tf[word] += 1

    return tf

print(tf("what was the actual the count the was what, ohno"))