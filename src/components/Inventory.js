import React from "react"
import PropTypes from "prop-types"
import firebase from "firebase"
import AddFishForm from "./AddFishForm"
import EditFishForm from "./EditFishForm"
import Login from "./Login"
import base, { firebaseApp } from "../base"

class Inventory extends React.Component {
  static propTypes = {
    fishes: PropTypes.object,
    addFish: PropTypes.func,
    deleteFish: PropTypes.func,
    updateFish: PropTypes.func,
    loadSampleFishes: PropTypes.func,
  }

  state = {
    uid: null,
    owner: null
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      if(user) {
        this.authHandler({ user })
      }
    })
  }

  authHandler = async (authData) => {
    // 1. lookup the current store in the DB
    const store = await base.fetch(this.props.storeId, {context: this})
    console.log(store);
    // 2. claim it if there is no owner
    if (!store.owner) {
      await base.post(`${this.props.storeId}/owner`, {
        data: authData.user.uid
      })
    }
    // 3. set the state of the inventory component to reflect the current user
    this.setState({
      uid: authData.user.uid,
      owner: store.owner || authData.user.uid
    })
    
    console.log(authData);
  }

  authenticate = (provider) => {
    const authProvider = new firebase.auth[`${provider}AuthProvider`]()
    firebaseApp.auth().signInWithPopup(authProvider).then(this.authHandler)
  }

  logout = async () => {
    await firebase.auth().signOut();
    this.setState({ uid: null })
  }

  render() {
    const logout = <button onClick={this.logout}>Logout</button>

    // 1. check if the user is logged in
    if (!this.state.uid) {
      return <Login authenticate={this.authenticate} />
    }
    
    // 2. check if the logged in user is not the owner
    if (this.state.uid !== this.state.owner) {
      return <div>
          <p>Sorry, but you are not the owner!</p>
          {logout}
        </div>
    }

    // 3. They must be the owner, so render the inventory
    return (
      <div className="inventory">
        <h2>Inventory!!!</h2>
        {logout}
        {Object.keys(this.props.fishes).map(key => <EditFishForm fish={this.props.fishes[key]} key={key} index={key} updateFish={this.props.updateFish} deleteFish={this.props.deleteFish} />)}

        <AddFishForm addFish={this.props.addFish} />

        <button onClick={this.props.loadSampleFishes}>Load sample fishes</button>
      </div>
    )
  }
}

export default Inventory
