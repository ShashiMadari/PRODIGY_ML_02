import pandas as pd # type: ignore
import joblib # type: ignore
import matplotlib # type: ignore
matplotlib.use('Agg')  # Use the Anti-Grain Geometry backend (non-GUI)
import matplotlib.pyplot as plt # type: ignore
import seaborn as sns # type: ignore
from flask import Flask, request, jsonify, send_file # type: ignore
import io
import os

app = Flask(__name__)

# Load trained model and scaler
kmeans = joblib.load(open("kmeans_model.pkl", "rb"))
scaler = joblib.load(open("scaler.pkl", "rb"))

# Load clustered data
df = pd.read_csv("cleaned_clustered_customers.csv")

# 📌 Route to get customer data in JSON format
@app.route("/get_clusters", methods=["GET"])
def get_clusters():
    return jsonify(df.to_dict(orient="records"))  # Send JSON response

# 📌 Route to dynamically generate graphs
@app.route("/graph/<graph_type>", methods=["GET"])
def generate_graph(graph_type):
    plt.figure(figsize=(10, 6))

    if graph_type == "scatter":
        sns.scatterplot(
            x=df["Annual Income (k$)"], 
            y=df["Spending Score (1-100)"], 
            hue=df["Cluster"], 
            style=df["Gender"], 
            palette="viridis"
        )
        plt.title("Customer Clusters Based on Gender")
        plt.xlabel("Annual Income (k$)")
        plt.ylabel("Spending Score (1-100)")

    elif graph_type == "count":
        sns.countplot(x=df["Cluster"], hue=df["Gender"], palette="coolwarm")
        plt.title("Cluster Distribution by Gender")
        plt.xlabel("Cluster")
        plt.ylabel("Number of Customers")

    elif graph_type == "box":
        sns.boxplot(x="Cluster", y="Spending Score (1-100)", data=df, hue="Cluster", palette="Set2", dodge=False)
        plt.title("Spending Score Distribution Across Clusters")

    elif graph_type == "bar":
        avg_income = df.groupby("Cluster")["Annual Income (k$)"].mean()
        avg_income.plot(kind="bar", color="steelblue", edgecolor="black")  # Fixed missing bar plot
        plt.title("Average Income by Cluster")
        plt.xlabel("Cluster")
        plt.ylabel("Avg Annual Income (k$)")

    else:
        return jsonify({"error": "Invalid graph type"}), 400

    plt.legend(title="Cluster")
    img = io.BytesIO()
    plt.savefig(img, format="png")
    img.seek(0)
    plt.close()
    return send_file(img, mimetype="image/png")

model = joblib.load("kmeans_model.pkl")
csv_file = "customer_data.csv"

model = joblib.load("kmeans_model.pkl")
csv_file = "customer_data.csv"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    try:
        age = int(data["age"])
        income = float(data["income"])
        spending = float(data["spending"])
        gender = 1 if data["gender"] == "Male" else 0  # Encode gender

        # Predict cluster
        cluster = model.predict([[age, income, spending, gender]])[0]

        # Append to CSV
        new_data = pd.DataFrame([[age, income, spending, gender, cluster]], 
                                 columns=["Age", "Annual Income (k$)", "Spending Score (1-100)", "Gender", "Cluster"])
        if os.path.exists(csv_file):
            new_data.to_csv(csv_file, mode='a', header=False, index=False)
        else:
            new_data.to_csv(csv_file, mode='w', index=False)

        return jsonify({"cluster": int(cluster)})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)
