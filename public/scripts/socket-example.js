// tutorial code

//
// Client-side logic, using React
//

// Converted from AJAX->socket.io 28 November 2015
var socket = io.connect(document.location.href);
var CommentBox = React.createClass({
  loadCommentsFromServer: function(data) {
    // No more AJAX!!
    this.setState({data: data});
  },
  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    // Optimistically set an id on the new comment. It will be replaced by an
    // id generated by the server. In a production application you would likely
    // not use Date.now() for this and would have a more robust system in place.
    comment.id = Date.now();
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});
    // Send the data via socket.io
    //   Note no error checking yet
    socket.emit('submission', comment);
    // Update message will take care of necessary refresh from server
    },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    // This code is auto-run by React on when the component renders

    // Why do I have to do this to solve scoping error?
    var displayComments = this.loadCommentsFromServer;

    // Prime the pump by requesting an update from server
    socket.emit('send_data');

    // All updates (e.g. after new entry submit too!!) are processed here
    socket.on('update', function(data) {
      // console.log(JSON.stringify(data));
      displayComments(data);
      });
    },
  render: function() {
    return (
      <div className="commentBox">
        <TopDiv />
        <h1>Current Comments:</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});

// Add a gratuitous component at the top of the page
var TopDiv = React.createClass( {
  render: function() {
    return (<div className="topDiv">
      <h3>I am just a topdiv hanging out up here above the rest</h3>
    </div>
    );
  }
});

var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function(comment) {
      return (
        <Comment author={comment.author} key={comment.id} printKey={comment.id}>
        {comment.text}
        </Comment>
      );
    });
    return (
      <div className="commentList">
      {commentNodes}
      </div>
    );
  }
});

var Comment = React.createClass({
  printDate: function() {
    var printedDate = new Date(this.props.printKey);
    return { __html: printedDate.toLocaleString() };
  },
  rawMarkup: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return { __html: rawMarkup };
  },
  render: function() {
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        (Posted: <span dangerouslySetInnerHTML= {this.printDate()} />)
        <span dangerouslySetInnerHTML={this.rawMarkup()} />
      </div>
    );
  }
});

var CommentForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: ''};
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    this.setState({author: '', text: ''});
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
      <input
        type="text"
        placeholder="Your name"
        value={this.state.author}
        onChange={this.handleAuthorChange}
      />
      <input
        type="text"
        placeholder="Say something..."
        value={this.state.text}
        onChange={this.handleTextChange}
        />
      <input type="submit" value="Post" />
      </form>
    );
  }
});
ReactDOM.render(
  <CommentBox />,
  document.getElementById('content')
);
