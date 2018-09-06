import React, { Component } from "react";
import { Pause, Play } from "react-feather";
import logo from "./logo.svg";
import "./App.css";

class App extends Component {
  constructor() {
    super();
    this.state = {
      searchTerm: "",
      relatedArtists: [],
      topSongs: [],
      songPlayingId: null,
      playing: false
    };

    this.onInputChange = this.onInputChange.bind(this);
    this.performSearch = this.performSearch.bind(this);
  }

  onInputChange(e) {
    e.preventDefault();
    this.setState({ searchTerm: e.target.value });
  }

  async performSearch() {
    if (process.env.REACT_APP_SPOTIFY_ACCESS_TOKEN) {
      const { searchTerm } = this.state;
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${searchTerm}&type=album`,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${
              process.env.REACT_APP_SPOTIFY_ACCESS_TOKEN
            }`
          }
        }
      );
      const data = await res.json();
      const id = data.albums.items[0].artists[0].id;
      const [artistsRes, songsRes] = await Promise.all([
        this.getSimilarArtists(id),
        this.getTopSongs(id)
      ]);
      const artistInfo = await artistsRes.json();
      const songInfo = await songsRes.json();
      const songs = songInfo.tracks.map(song => ({
        ...song
      }));
      this.setState({
        topSongs: [...songs],
        relatedArtists: [...artistInfo.artists.slice(0, 10)]
      });
    }
  }

  getSimilarArtists(id) {
    return fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${process.env.REACT_APP_SPOTIFY_ACCESS_TOKEN}`
      }
    });
  }

  getTopSongs(id) {
    return fetch(
      `https://api.spotify.com/v1/artists/${id}/top-tracks?country=US`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${process.env.REACT_APP_SPOTIFY_ACCESS_TOKEN}`
        }
      }
    );
  }

  changeAudioSrc(song) {
    this.audio.pause();
    this.audio.src = song.preview_url;
    this.audio.play();
  }

  toggleTrack(e, song, index) {
    const { target } = e;
    const { songPlayingId, playing } = this.state;

    if (playing) {
      if (song.id === songPlayingId) {
        this.audio.pause();
        this.setState({ playing: false });
      } else {
        if (this.audio) {
          this.changeAudioSrc(song);
          this.setState({ songPlayingId: song.id });
        }
      }
    } else {
      if (song.id === songPlayingId) {
        this.audio.play();
        this.setState({ playing: true });
        return;
      }
      if (this.audio) {
        this.changeAudioSrc(song);
        this.setState({ songPlayingId: song.id, playing: true });
        return;
      }
      this.audio = new Audio(song.preview_url);
      this.audio.play();
      this.setState({ songPlayingId: song.id, playing: true });
    }
  }

  render() {
    const { songPlayingId, playing } = this.state;

    return (
      <div className="App">
        <div className="search-area">
          <input
            name="search"
            value={this.state.searchTerm}
            placeholder="Enter artiste name"
            onChange={this.onInputChange}
          />
          <div className="button-holder">
            <button onClick={this.performSearch}>Search</button>
          </div>
        </div>
        {this.state.topSongs.length > 0 &&
          this.state.relatedArtists.length > 0 && (
            <div className="results">
              <div className="related-artists">
                <h4>Related Artistes</h4>
                <div className="artists">
                  {this.state.relatedArtists.map(artist => (
                    <div className="result artist" key={artist.id}>
                      <div className="img">
                        <img src={artist.images[1].url} alt="" />
                      </div>
                      <p>{artist.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              <hr />
              <div className="top-songs">
                <h4>Top Songs</h4>
                <div className="songs">
                  {this.state.topSongs.map((song, index) => (
                    <div className="result song" key={song.id}>
                      <div
                        className={`img ${
                          songPlayingId === song.id ? "playing" : ""
                        }`}
                        onClick={e => this.toggleTrack(e, song, index)}
                      >
                        {playing && songPlayingId === song.id ? (
                          <Pause color="whitesmoke" size="30" />
                        ) : (
                          <Play color="whitesmoke" size="30" />
                        )}
                        <img src={song.album.images[1].url} alt="" />
                      </div>
                      <p>{song.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    );
  }
}

export default App;
