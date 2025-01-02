from pymongo import MongoClient



def get_Client():
    client = MongoClient("mongodb+srv://bd1:Papun$1996@cluster0.mehhr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary",
                          tls=True,
    tlsAllowInvalidCertificates=True) 
    return client