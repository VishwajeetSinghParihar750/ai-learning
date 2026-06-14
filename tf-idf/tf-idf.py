import json
import math


docsCount:int = 0
termIndex = {}
inDocsFrequency = {}

tfIdf = {}


def tlIdfVector(doc):
    termFrequency = [0] * len(termIndex)
    currentTfIdfVector  = [0] * len(termIndex)

    for word in doc.split():

        # add to term freq
        termFrequency[termIndex[word]] += 1;
        currentTfIdfVector [termIndex[word]] = termFrequency[termIndex[word]] * math.log(docsCount / inDocsFrequency[termIndex[word]])
            
    return currentTfIdfVector 



def buildVocab():
    with open("./documents.json") as file:
        data = json.load(file)

        global docsCount 
        docsCount = len(data)

        for doc in data:
            found = set()

            for word in doc["content"].split():

                # creating volab 
                if not word in termIndex:
                    termIndex[word] = len(termIndex)
                    inDocsFrequency[termIndex[word]] = 0

                if not word in found:
                    inDocsFrequency[termIndex[word]] += 1;
                    found.add(word)


        for doc in data:
            tfIdf[doc["id"]] = tlIdfVector(doc["content"])
            



def normalizedDotProduct(v1, v2):
    num = 0
    v1Squaresum = 0
    v2Squaresum = 0

    for idx in range(len(v1)):
        v1Squaresum += v1[idx] ** 2
        v2Squaresum += v2[idx] ** 2

        num += v1[idx] * v2[idx]

    return num / math.sqrt(v1Squaresum) / math.sqrt(v2Squaresum)


def tfIdfFunction(doc):
    with open("./documents.json") as file:
        data = json.load(file)

        buildVocab()
        docTfIfd = tlIdfVector(doc)

        bestKey = 0
        bestDotProduct = -1
        for key ,value in tfIdf.items():
            currentDotProduct = normalizedDotProduct(docTfIfd , value)

            # print(currentDotProduct)
            # print(next((d for d in data if d["id"] == key), None))

            if currentDotProduct > bestDotProduct:
                bestKey = key
                bestDotProduct = currentDotProduct
        
        doc = next((d for d in data if d["id"] == bestKey), None)
        return doc


print(tfIdfFunction("intelligence systems"))



