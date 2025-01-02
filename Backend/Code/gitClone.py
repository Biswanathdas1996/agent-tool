import os
import git
from git.exc import GitCommandError
import shutil
import stat



def clone_github_repo(repo_url):
    """
    Clone a GitHub repository to a specified destination folder.

    Args:
        repo_url (str): The URL of the GitHub repository.
        dest_folder (str): The destination folder to save the repository code.

    Returns:
        str: A message indicating success or failure.
    """
    dest_folder = 'Code/src_code'

    # Delete everything in the destination folder if it exists
    if os.path.exists(dest_folder):
        
        for root, dirs, files in os.walk(dest_folder, topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))
  
    try:
        # Ensure the destination folder exists
        if not os.path.exists(dest_folder):
            os.makedirs(dest_folder)

        # Clone the repository
        print(f"Cloning the repository {repo_url} into {dest_folder}...")
        repo = git.Repo.clone_from(repo_url, dest_folder)
        # Remove the .git folder
        git_dir = os.path.join(dest_folder, '.git')
        if os.path.exists(git_dir):
            def remove_readonly(func, path, excinfo):
                os.chmod(path, stat.S_IWRITE)
                func(path)
            
            shutil.rmtree(git_dir, onerror=remove_readonly)

            # Generate the folder structure as a JSON tree
            folder_structure = {}
            for root, dirs, files in os.walk(dest_folder):
                folder_path = os.path.relpath(root, dest_folder)
                if folder_path == '.':
                    folder_path = ''
                folder_structure[folder_path] = {'dirs': dirs, 'files': files}

            return folder_structure
        return f"Repository cloned successfully to {dest_folder}"
    


    except GitCommandError as e:
        return f"Failed to clone the repository. Error: {e}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


# repo_url = 'https://github.com/Biswanathdas1996/code-review'
 
