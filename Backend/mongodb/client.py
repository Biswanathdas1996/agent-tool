from pymongo import MongoClient


def get_Client():
    try:
        client = MongoClient(
            "mongodb+srv://bd1:Papun$1996@cluster0.mehhr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&readPreference=primary",
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        return client
    except Exception as e:
        print(f"An error occurred while connecting to MongoDB: {e}")
        return None